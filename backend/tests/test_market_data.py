import market_data
import runtime_state
import store


def test_past_square_off_false_when_disabled():
    settings = {**store.DEFAULT_SETTINGS, "forceSquareOff": False, "allowOvernight": False, "squareOffTime": "00:00"}
    assert market_data._past_square_off(settings) is False


def test_past_square_off_false_when_overnight_allowed():
    settings = {**store.DEFAULT_SETTINGS, "forceSquareOff": True, "allowOvernight": True, "squareOffTime": "00:00"}
    assert market_data._past_square_off(settings) is False


def test_past_square_off_true_once_time_passed():
    settings = {**store.DEFAULT_SETTINGS, "forceSquareOff": True, "allowOvernight": False, "squareOffTime": "00:00"}
    assert market_data._past_square_off(settings) is True


def test_daily_loss_breaker_pauses_trading(monkeypatch):
    runtime_state.load()
    store.update_settings({"maxDailyLoss": 1000})
    monkeypatch.setattr(market_data.risk, "realized_pnl_today", lambda: -1500)
    market_data._loss_breaker_date = None

    market_data._check_daily_loss_breaker()

    assert runtime_state.state["tradingEnabled"] is False
    assert store.get_runtime_state()["tradingEnabled"] is False


def test_daily_loss_breaker_only_fires_once_per_day(monkeypatch):
    runtime_state.load()
    store.update_settings({"maxDailyLoss": 1000})
    monkeypatch.setattr(market_data.risk, "realized_pnl_today", lambda: -1500)
    market_data._loss_breaker_date = None

    market_data._check_daily_loss_breaker()
    runtime_state.set(tradingEnabled=True)  # operator re-enables manually
    market_data._check_daily_loss_breaker()  # should not re-pause same day

    assert runtime_state.state["tradingEnabled"] is True
