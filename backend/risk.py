from datetime import datetime

import execution
import store


def _today() -> str:
    return datetime.now().astimezone().date().isoformat()


def trades_opened_today() -> int:
    today = _today()
    opened_ids = {p["id"] for p in store.list_positions() if p["openedAt"][:10] == today}
    opened_ids |= {t["positionId"] for t in store.list_trades() if t["openedAt"][:10] == today}
    return len(opened_ids)


def capital_deployed() -> float:
    return sum(p["averageEntry"] * p["quantity"] for p in store.list_positions())


def realized_pnl_today() -> float:
    today = _today()
    return sum(t["realizedPnL"] for t in store.list_trades() if t["closedAt"][:10] == today)


def check_entry(signal: dict, ltp: float, lotsize: int) -> str | None:
    settings = store.get_settings()

    if trades_opened_today() >= settings["maxTradesPerDay"]:
        return "maxTradesPerDay reached"
    if len(store.list_positions()) >= settings["maxSimultaneousPositions"]:
        return "maxSimultaneousPositions reached"
    if realized_pnl_today() <= -settings["maxDailyLoss"]:
        return "maxDailyLoss breached"

    _lots, quantity = execution.size_position(ltp, lotsize)
    if capital_deployed() + ltp * quantity > settings["maxCapitalDeployed"]:
        return "maxCapitalDeployed would be exceeded"

    entry_price = signal["entryPrice"]
    if entry_price > 0:
        slippage_pct = abs(ltp - entry_price) / entry_price * 100
        if slippage_pct > settings["maxEntrySlippagePercent"]:
            return f"entry slippage {slippage_pct:.1f}% exceeds maxEntrySlippagePercent"

    return None


def is_stale(signal: dict) -> bool:
    settings = store.get_settings()
    received = datetime.fromisoformat(signal["receivedAt"])
    age = (datetime.now(received.tzinfo) - received).total_seconds()
    return age > settings["maxSignalAgeSeconds"]


def has_moved_too_far(signal: dict, ltp: float) -> bool:
    settings = store.get_settings()
    if not settings["skipMovedPrice"] or signal["entryPrice"] <= 0:
        return False
    distance_pct = abs(ltp - signal["entryPrice"]) / signal["entryPrice"] * 100
    return distance_pct > settings["maxEntryDistancePercent"]


def is_duplicate_active(signal: dict) -> bool:
    settings = store.get_settings()
    if not settings["rejectDuplicateSignals"]:
        return False
    key = (signal["underlying"], signal["expiry"], signal["strike"], signal["optionType"])
    active_statuses = {"WAITING_FOR_ENTRY", "ENTRY_TRIGGERED", "POSITION_OPEN"}
    for other in store.list_signals():
        if other["id"] == signal["id"] or other["status"] not in active_statuses:
            continue
        if (other["underlying"], other["expiry"], other["strike"], other["optionType"]) != key:
            continue
        if other["receivedAt"] < signal["receivedAt"]:
            return True
    return False
