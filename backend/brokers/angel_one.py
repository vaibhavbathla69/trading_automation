import logging
import os
import threading
import time

import pyotp
from SmartApi import SmartConnect
from SmartApi.smartWebSocketV2 import SmartWebSocketV2

API_KEY = os.environ["ANGEL_API_KEY"]
CLIENT_CODE = os.environ["ANGEL_CLIENT_CODE"]
PIN = os.environ["ANGEL_PIN"]
TOTP_SECRET = os.environ["ANGEL_TOTP_SECRET"]

log = logging.getLogger(__name__)

NFO_EXCHANGE_TYPE = 2
LTP_MODE = 1
TICK_STALE_SECONDS = 15  # ponytail: fall back to REST if a token's last tick is older than this

_state = {"connected": False, "last_error": None}
_client: SmartConnect | None = None
_ws: SmartWebSocketV2 | None = None
_ticks: dict[str, tuple[float, float]] = {}  # token -> (ltp, received_at monotonic)
_subscribed: set[str] = set()


def get_state() -> dict:
    return dict(_state)


def login() -> SmartConnect | None:
    global _client
    try:
        client = SmartConnect(api_key=API_KEY)
        totp = pyotp.TOTP(TOTP_SECRET).now()
        session = client.generateSession(CLIENT_CODE, PIN, totp)
        if not session.get("status"):
            raise RuntimeError(session.get("message", "login rejected"))
        _client = client
        _state.update(connected=True, last_error=None)
        log.info("Angel One login succeeded")
        _start_websocket(session["data"])
        return client
    except Exception as exc:
        _client = None
        _state.update(connected=False, last_error=str(exc))
        log.error("Angel One login failed: %s", exc)
        return None


def _on_data(_wsapp, data):
    token = data.get("token")
    ltp = data.get("last_traded_price")
    if token is None or ltp is None:
        return
    _ticks[token] = (ltp / 100, time.monotonic())


def _start_websocket(session_data: dict):
    global _ws
    try:
        feed_token = _client.getfeedToken()
        ws = SmartWebSocketV2(session_data["jwtToken"], API_KEY, CLIENT_CODE, feed_token)
        ws.on_data = _on_data
        ws.on_open = lambda _wsapp: _resubscribe_all(ws)
        threading.Thread(target=ws.connect, daemon=True).start()
        _ws = ws
    except Exception as exc:
        # ponytail: websocket is a latency optimization only — REST polling in get_ltp still works without it
        _state["last_error"] = f"websocket start failed: {exc}"
        log.warning("websocket start failed, falling back to REST polling: %s", exc)


def _resubscribe_all(ws: SmartWebSocketV2):
    if _subscribed:
        ws.subscribe("ltp_feed", LTP_MODE, [{"exchangeType": NFO_EXCHANGE_TYPE, "tokens": list(_subscribed)}])


def _ensure_subscribed(symboltoken: str):
    if symboltoken in _subscribed or _ws is None:
        return
    _subscribed.add(symboltoken)
    try:
        _ws.subscribe("ltp_feed", LTP_MODE, [{"exchangeType": NFO_EXCHANGE_TYPE, "tokens": [symboltoken]}])
    except Exception as exc:
        _state["last_error"] = f"websocket subscribe failed: {exc}"


def get_ltp(exchange: str, tradingsymbol: str, symboltoken: str) -> float | None:
    if _client is None:
        return None

    _ensure_subscribed(symboltoken)
    tick = _ticks.get(symboltoken)
    if tick is not None and time.monotonic() - tick[1] <= TICK_STALE_SECONDS:
        return tick[0]

    try:
        resp = _client.ltpData(exchange, tradingsymbol, symboltoken)
        if not resp.get("status"):
            return None
        return float(resp["data"]["ltp"])
    except Exception as exc:
        # session likely expired (daily JWT) or broker API down — flip disconnected so the
        # market_data poll loop retries login instead of silently stalling on stale LTP forever.
        _state.update(connected=False, last_error=str(exc))
        log.error("get_ltp failed, marking broker disconnected: %s", exc)
        return None
