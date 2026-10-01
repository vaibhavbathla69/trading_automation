import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import alerts
import broker
import execution
import instruments
import realtime
import risk
import runtime_state
import store

log = logging.getLogger(__name__)

POLL_SECONDS = 5
AT_TOLERANCE = 0.5
IST = ZoneInfo("Asia/Kolkata")

_was_connected = True
_loss_breaker_date = None  # date string of the last day the daily-loss breaker already fired


def _entry_hit(signal: dict, ltp: float) -> bool:
    if signal["entryType"] == "ABOVE":
        return ltp >= signal["entryPrice"]
    if signal["entryType"] == "BELOW":
        return ltp <= signal["entryPrice"]
    return abs(ltp - signal["entryPrice"]) <= AT_TOLERANCE


def _check_entries():
    for signal in store.list_signals():
        if signal["status"] != "WAITING_FOR_ENTRY":
            continue

        if risk.is_stale(signal):
            execution.reject_signal(signal, "EXPIRED", "EXPIRED", "Signal exceeded maxSignalAgeSeconds")
            continue
        if risk.is_duplicate_active(signal):
            execution.reject_signal(signal, "REJECTED", "REJECTED", "Duplicate active signal for same contract")
            continue

        match = instruments.find_token(signal["underlying"], signal["expiry"], signal["strike"], signal["optionType"])
        if match is None:
            continue
        token, tradingsymbol, exch_seg, lotsize = match
        ltp = broker.get_ltp(exch_seg, tradingsymbol, token)
        if ltp is None:
            continue

        if risk.has_moved_too_far(signal, ltp):
            execution.reject_signal(signal, "SKIPPED", "SKIPPED", f"Price {ltp} moved beyond maxEntryDistancePercent")
            continue

        if not _entry_hit(signal, ltp):
            signal["ltp"] = ltp
            store.insert_signal(signal)
            realtime.broadcast("signal.updated", signal)
            continue

        reason = risk.check_entry(signal, ltp, lotsize)
        if reason:
            execution.reject_signal(signal, "REJECTED", "REJECTED", reason)
            continue

        execution.open_position(signal, ltp, lotsize)


def _check_exits():
    for position in store.list_positions():
        match = instruments.find_token(position["underlying"], position["expiry"], position["strike"], position["optionType"])
        if match is None:
            continue
        token, tradingsymbol, exch_seg, _lotsize = match
        ltp = broker.get_ltp(exch_seg, tradingsymbol, token)
        if ltp is None:
            continue

        signal = store.get_signal(position["signalId"])
        if ltp <= position["stopLoss"]:
            execution.close_position(position, ltp, "STOP_LOSS", signal)
        elif ltp >= position["targetMin"]:
            execution.close_position(position, ltp, "TARGET", signal)
        else:
            execution.update_position_pnl(position, ltp)


def _past_square_off(settings: dict) -> bool:
    if not settings["forceSquareOff"] or settings["allowOvernight"]:
        return False
    return datetime.now(IST).strftime("%H:%M") >= settings["squareOffTime"]


def _check_daily_loss_breaker():
    global _loss_breaker_date
    today = datetime.now(IST).date().isoformat()
    if _loss_breaker_date == today:
        return
    settings = store.get_settings()
    if risk.realized_pnl_today() <= -settings["maxDailyLoss"]:
        runtime_state.set(tradingEnabled=False)
        _loss_breaker_date = today
        log.warning("daily loss breaker tripped: limit %s", settings["maxDailyLoss"])
        alerts.notify(f"Daily loss limit ({settings['maxDailyLoss']}) breached. New trades paused.")


def _check_square_off():
    for position in store.list_positions():
        ltp = position["ltp"]
        match = instruments.find_token(position["underlying"], position["expiry"], position["strike"], position["optionType"])
        if match is not None:
            token, tradingsymbol, exch_seg, _lotsize = match
            fetched = broker.get_ltp(exch_seg, tradingsymbol, token)
            if fetched is not None:
                ltp = fetched
        signal = store.get_signal(position["signalId"])
        execution.close_position(position, ltp, "SQUARE_OFF", signal)


async def run():
    global _was_connected
    while True:
        await asyncio.sleep(POLL_SECONDS)

        connected = broker.get_state()["connected"]
        if connected != _was_connected:
            msg = "Broker reconnected." if connected else f"Broker disconnected: {broker.get_state()['last_error']}"
            (log.info if connected else log.error)(msg)
            alerts.notify(msg)
            _was_connected = connected
        if not connected:
            broker.login()  # retries session (also recovers from daily JWT expiry)
            continue

        _check_exits()  # always run — closing out risk should never be gated by the pause/stop flags
        _check_daily_loss_breaker()

        settings = store.get_settings()
        if _past_square_off(settings):
            _check_square_off()
            continue

        rt = runtime_state.state
        if rt["tradingEnabled"] and rt["autoExecutionEnabled"] and not rt["emergencyStopped"]:
            _check_entries()
