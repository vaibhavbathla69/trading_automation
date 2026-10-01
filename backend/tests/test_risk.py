from datetime import datetime, timedelta, timezone

import execution
import risk
import store

SIGNAL = {
    "id": "sig_1", "receivedAt": "2026-09-29T10:00:00+05:30",
    "underlying": "NIFTY", "expiry": "2026-10-02", "strike": 24000,
    "optionType": "CE", "entryPrice": 150, "stopLoss": 120, "targetMin": 180, "targetMax": None,
    "source": "Mani Telegram", "broker": "Angel One", "status": "WAITING_FOR_ENTRY",
    "outcome": "WAITING", "timeline": [],
}


def test_check_entry_passes_within_all_limits():
    assert risk.check_entry(SIGNAL, ltp=150, lotsize=50) is None


def test_check_entry_rejects_when_max_trades_per_day_reached():
    store.update_settings({"maxTradesPerDay": 1})
    execution.open_position(dict(SIGNAL), ltp=150, lotsize=50)
    reason = risk.check_entry(SIGNAL, ltp=150, lotsize=50)
    assert reason == "maxTradesPerDay reached"


def test_check_entry_rejects_on_excess_slippage():
    store.update_settings({"maxEntrySlippagePercent": 1})
    reason = risk.check_entry(SIGNAL, ltp=200, lotsize=50)
    assert reason is not None
    assert "slippage" in reason


def test_is_stale_signal():
    store.update_settings({"maxSignalAgeSeconds": 90})
    old_time = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    recent_time = (datetime.now(timezone.utc) - timedelta(seconds=5)).isoformat()
    assert risk.is_stale({**SIGNAL, "receivedAt": old_time}) is True
    assert risk.is_stale({**SIGNAL, "receivedAt": recent_time}) is False


def test_has_moved_too_far():
    store.update_settings({"skipMovedPrice": True, "maxEntryDistancePercent": 2})
    assert risk.has_moved_too_far(SIGNAL, ltp=150) is False
    assert risk.has_moved_too_far(SIGNAL, ltp=200) is True


def test_is_duplicate_active_detects_earlier_matching_signal():
    earlier = {**SIGNAL, "id": "sig_earlier", "receivedAt": "2026-09-29T09:00:00+05:30"}
    store.insert_signal(earlier)
    later = {**SIGNAL, "id": "sig_later", "receivedAt": "2026-09-29T10:00:00+05:30"}
    assert risk.is_duplicate_active(later) is True


def test_is_duplicate_active_false_when_disabled():
    store.update_settings({"rejectDuplicateSignals": False})
    earlier = {**SIGNAL, "id": "sig_earlier", "receivedAt": "2026-09-29T09:00:00+05:30"}
    store.insert_signal(earlier)
    later = {**SIGNAL, "id": "sig_later", "receivedAt": "2026-09-29T10:00:00+05:30"}
    assert risk.is_duplicate_active(later) is False
