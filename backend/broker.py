"""Active-broker facade. Each adapter in brokers/ exposes the same three
functions: login(), get_state(), get_ltp(exchange, tradingsymbol, symboltoken).
Add a new broker by writing brokers/<name>.py with that shape and registering
it in ADAPTERS below — callers (market_data.py, risk.py) never change.
"""

import store
from brokers import angel_one

ADAPTERS = {
    "Angel One": angel_one,
}
DEFAULT_BROKER = "Angel One"

_active = ADAPTERS[DEFAULT_BROKER]


def _select_active():
    global _active
    name = store.get_settings().get("broker", DEFAULT_BROKER)
    _active = ADAPTERS.get(name, ADAPTERS[DEFAULT_BROKER])
    return _active


def login():
    return _select_active().login()


def get_state() -> dict:
    return _active.get_state()


def get_ltp(exchange: str, tradingsymbol: str, symboltoken: str) -> float | None:
    return _active.get_ltp(exchange, tradingsymbol, symboltoken)
