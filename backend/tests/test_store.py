import pytest

import store


def test_settings_defaults_roundtrip():
    settings = store.get_settings()
    assert settings["maxDailyLoss"] == store.DEFAULT_SETTINGS["maxDailyLoss"]


def test_update_settings_applies_patch():
    updated = store.update_settings({"maxDailyLoss": 8000})
    assert updated["maxDailyLoss"] == 8000
    assert store.get_settings()["maxDailyLoss"] == 8000


@pytest.mark.parametrize("patch", [
    {"maxDailyLoss": 1},
    {"maxTradesPerDay": 0},
    {"fixedLots": 1000},
    {"mode": "HACKED"},
    {"sizingMethod": "NOT_A_METHOD"},
    {"squareOffTime": "25:99"},
])
def test_update_settings_rejects_out_of_bounds(patch):
    with pytest.raises(ValueError):
        store.update_settings(patch)
    # rejected patch must not partially apply
    current = store.get_settings()
    for key, value in patch.items():
        assert current[key] != value


def test_runtime_state_persists_across_reload():
    store.save_runtime_state({"tradingEnabled": False, "autoExecutionEnabled": False, "emergencyStopped": True})
    reloaded = store.get_runtime_state()
    assert reloaded["emergencyStopped"] is True
    assert reloaded["tradingEnabled"] is False


def test_position_and_trade_lifecycle():
    position = {"id": "pos_1", "status": "POSITION_OPEN"}
    store.insert_position(position)
    assert store.get_position("pos_1") == position
    assert len(store.list_positions()) == 1

    store.delete_position("pos_1")
    assert store.get_position("pos_1") is None
    assert store.list_positions() == []

    trade = {"id": "trade_1", "realizedPnL": 100}
    store.insert_trade(trade)
    assert store.get_trade("trade_1") == trade
