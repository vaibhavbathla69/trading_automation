from datetime import datetime, timezone
from uuid import uuid4

import realtime
import store


def _now() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat()


def _log(level: str, message: str, detail: str, signal_id: str):
    log = {
        "id": f"log_{uuid4().hex[:8]}", "at": _now(), "level": level, "message": message,
        "detail": detail, "signalId": signal_id, "positionId": None,
    }
    store.insert_log(log)
    realtime.broadcast("log.created", log)


def size_position(ltp: float, lotsize: int) -> tuple[int, int]:
    settings = store.get_settings()
    if settings["sizingMethod"] == "LOTS":
        lots = settings["fixedLots"]
    else:
        lots = max(1, int(settings["capitalPerTrade"] // (ltp * lotsize)))
    return lots, lots * lotsize


def reject_signal(signal: dict, status: str, outcome: str, reason: str):
    now = _now()
    signal["status"] = status
    signal["outcome"] = outcome
    signal["rejectionReason"] = reason
    signal["resultingAction"] = reason
    signal["timeline"].append({
        "id": f"e_{uuid4().hex[:6]}", "at": now, "title": status.replace("_", " ").title(),
        "detail": reason, "level": "WARNING",
    })
    store.insert_signal(signal)
    realtime.broadcast("signal.updated", signal)
    _log("WARNING", f"Signal {status.lower()}", reason, signal["id"])


def open_position(signal: dict, ltp: float, lotsize: int) -> dict:
    lots, quantity = size_position(ltp, lotsize)
    now = _now()

    position = {
        "id": f"pos_{uuid4().hex[:8]}", "signalId": signal["id"], "underlying": signal["underlying"],
        "expiry": signal["expiry"], "strike": signal["strike"], "optionType": signal["optionType"],
        "quantity": quantity, "lots": lots, "averageEntry": ltp, "signalPrice": signal["entryPrice"],
        "ltp": ltp, "stopLoss": signal["stopLoss"], "targetMin": signal["targetMin"],
        "targetMax": signal["targetMax"], "unrealizedPnL": 0.0, "status": "POSITION_OPEN",
        "openedAt": now, "source": signal["source"], "brokerOrderId": f"PAPER-{uuid4().hex[:10].upper()}",
        "broker": signal["broker"], "updates": [],
        "timeline": [{"id": f"e_{uuid4().hex[:6]}", "at": now, "title": f"Position opened @ {ltp}"}],
    }
    store.insert_position(position)
    realtime.broadcast("position.created", position)

    signal["status"] = "POSITION_OPEN"
    signal["outcome"] = "EXECUTED"
    signal["ltp"] = ltp
    signal["resultingAction"] = f"Position opened (paper) {position['id']}"
    signal["timeline"].append({"id": f"e_{uuid4().hex[:6]}", "at": now, "title": f"Entry triggered @ {ltp}"})
    signal["timeline"].append({"id": f"e_{uuid4().hex[:6]}", "at": now, "title": "Paper order filled", "detail": position["brokerOrderId"]})
    store.insert_signal(signal)
    realtime.broadcast("signal.updated", signal)

    _log("TRADE", "Position opened (paper)", f"{signal['underlying']} {signal['strike']}{signal['optionType']} x{quantity} @ {ltp}", signal["id"])
    return position


def update_position_pnl(position: dict, ltp: float):
    position["ltp"] = ltp
    position["unrealizedPnL"] = round((ltp - position["averageEntry"]) * position["quantity"], 2)
    store.insert_position(position)
    realtime.broadcast("position.updated", position)


# ponytail: targetRule (EXIT_FIRST/PARTIAL_FIRST/HOLD_UPPER/FOLLOW_UPDATES) and MANI_UPDATE-driven
# target changes are not implemented — this always does a single full exit on first SL or
# targetMin touch. Add partial-exit handling if the settings knob needs to actually do something.
def close_position(position: dict, exit_price: float, reason: str, signal: dict | None):
    now = _now()
    realized_pnl = round((exit_price - position["averageEntry"]) * position["quantity"], 2)
    trade = {
        "id": f"trade_{uuid4().hex[:8]}", "positionId": position["id"], "signalId": position["signalId"],
        "underlying": position["underlying"], "strike": position["strike"], "optionType": position["optionType"],
        "expiry": position["expiry"], "entryPrice": position["averageEntry"], "exitPrice": exit_price,
        "quantity": position["quantity"], "realizedPnL": realized_pnl, "exitReason": reason,
        "stopLoss": position["stopLoss"], "targetMin": position["targetMin"], "openedAt": position["openedAt"],
        "closedAt": now, "source": position["source"], "brokerOrderIds": [position["brokerOrderId"]],
    }
    store.insert_trade(trade)
    store.delete_position(position["id"])
    realtime.broadcast("trade.created", trade)
    realtime.broadcast("position.closed", {"id": position["id"]})

    if signal is not None:
        signal["status"] = "TARGET_HIT" if reason == "TARGET" else "STOP_LOSS_HIT" if reason == "STOP_LOSS" else "EXITED"
        signal["outcome"] = "EXECUTED"
        signal["ltp"] = exit_price
        signal["resultingAction"] = f"Closed via {reason} (paper), pnl={realized_pnl}"
        signal["timeline"].append({"id": f"e_{uuid4().hex[:6]}", "at": now, "title": f"Closed via {reason} @ {exit_price}"})
        store.insert_signal(signal)
        realtime.broadcast("signal.updated", signal)

    _log("TRADE", f"Position closed ({reason})", f"{position['underlying']} {position['strike']}{position['optionType']} pnl={realized_pnl}", position["signalId"])
