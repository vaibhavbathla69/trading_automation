import execution
import store

SIGNAL = {
    "id": "sig_1", "receivedAt": "2026-09-29T10:00:00+05:30",
    "underlying": "NIFTY", "expiry": "2026-10-02", "strike": 24000,
    "optionType": "CE", "entryPrice": 150, "stopLoss": 120, "targetMin": 180, "targetMax": None,
    "source": "Mani Telegram", "broker": "Angel One", "status": "WAITING_FOR_ENTRY",
    "outcome": "WAITING", "timeline": [],
}


def test_size_position_lots_method():
    store.update_settings({"sizingMethod": "LOTS", "fixedLots": 2})
    lots, quantity = execution.size_position(ltp=150, lotsize=50)
    assert lots == 2
    assert quantity == 100


def test_size_position_capital_method():
    store.update_settings({"sizingMethod": "CAPITAL", "capitalPerTrade": 15000})
    lots, quantity = execution.size_position(ltp=150, lotsize=50)
    assert lots == 2  # 15000 // (150*50) = 2
    assert quantity == 100


def test_open_and_close_position_lifecycle():
    signal = dict(SIGNAL)
    position = execution.open_position(signal, ltp=150, lotsize=50)

    assert position["status"] == "POSITION_OPEN"
    assert store.get_position(position["id"]) is not None
    assert signal["status"] == "POSITION_OPEN"

    execution.close_position(position, exit_price=180, reason="TARGET", signal=signal)

    assert store.get_position(position["id"]) is None
    trades = store.list_trades()
    assert len(trades) == 1
    assert trades[0]["realizedPnL"] == (180 - 150) * position["quantity"]
    assert signal["status"] == "TARGET_HIT"


def test_update_position_pnl():
    signal = dict(SIGNAL)
    position = execution.open_position(signal, ltp=150, lotsize=50)
    execution.update_position_pnl(position, ltp=160)
    assert position["unrealizedPnL"] == (160 - 150) * position["quantity"]
    stored = store.get_position(position["id"])
    assert stored is not None
    assert stored["ltp"] == 160
