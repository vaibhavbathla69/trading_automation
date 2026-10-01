import json
import sqlite3

DB_PATH = "trading.db"

DEFAULT_SETTINGS = {
    "tradingEnabled": True, "mode": "PAPER", "broker": "Angel One", "telegramSource": "Mani Telegram",
    "sizingMethod": "LOTS", "fixedLots": 2, "capitalPerTrade": 15000, "maxTradesPerDay": 8,
    "maxSimultaneousPositions": 3, "maxCapitalDeployed": 75000, "maxDailyLoss": 5000,
    "maxEntrySlippagePercent": 1, "maxSignalAgeSeconds": 90, "rejectDuplicateSignals": True,
    "maxEntryDistancePercent": 2, "skipMovedPrice": True, "orderType": "MARKET", "targetRule": "PARTIAL_FIRST",
    "forceSquareOff": True, "squareOffTime": "15:15", "allowOvernight": False,
}

DEFAULT_RUNTIME = {"tradingEnabled": True, "autoExecutionEnabled": True, "emergencyStopped": False}

# ponytail: hard floors/ceilings so a bad PUT /api/settings (fat-finger or compromised
# admin token) can't disable risk controls outright. (min, max) inclusive; mode is MODE not numeric.
SETTINGS_LIMITS = {
    "fixedLots": (1, 50),
    "capitalPerTrade": (1000, 10_000_000),
    "maxTradesPerDay": (1, 100),
    "maxSimultaneousPositions": (1, 20),
    "maxCapitalDeployed": (1000, 50_000_000),
    "maxDailyLoss": (500, 10_000_000),
    "maxEntrySlippagePercent": (0, 20),
    "maxSignalAgeSeconds": (10, 3600),
    "maxEntryDistancePercent": (0, 20),
}
SETTINGS_ENUMS = {
    "mode": {"PAPER", "LIVE"},
    "sizingMethod": {"LOTS", "CAPITAL"},
    "orderType": {"MARKET", "LIMIT"},
    "targetRule": {"EXIT_FIRST", "PARTIAL_FIRST", "HOLD_UPPER", "FOLLOW_UPDATES"},
    "broker": {"Angel One"},  # bump when a new brokers/<name>.py adapter is registered in broker.py
}


def validate_settings_patch(patch: dict):
    for key, (lo, hi) in SETTINGS_LIMITS.items():
        if key in patch and not (lo <= patch[key] <= hi):
            raise ValueError(f"{key} must be between {lo} and {hi}")
    for key, allowed in SETTINGS_ENUMS.items():
        if key in patch and patch[key] not in allowed:
            raise ValueError(f"{key} must be one of {sorted(allowed)}")
    if "squareOffTime" in patch:
        try:
            h, m = patch["squareOffTime"].split(":")
            assert 0 <= int(h) <= 23 and 0 <= int(m) <= 59
        except Exception:
            raise ValueError("squareOffTime must be HH:MM")


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _conn()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS signals (id TEXT PRIMARY KEY, receivedAt TEXT, data TEXT);
        CREATE TABLE IF NOT EXISTS logs (id TEXT PRIMARY KEY, at TEXT, data TEXT);
        CREATE TABLE IF NOT EXISTS positions (id TEXT PRIMARY KEY, data TEXT);
        CREATE TABLE IF NOT EXISTS trades (id TEXT PRIMARY KEY, data TEXT);
        CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT);
        CREATE TABLE IF NOT EXISTS runtime (id TEXT PRIMARY KEY, data TEXT);
        """
    )
    conn.commit()
    if conn.execute("SELECT 1 FROM settings WHERE id = 'singleton'").fetchone() is None:
        conn.execute("INSERT INTO settings VALUES ('singleton', ?)", (json.dumps(DEFAULT_SETTINGS),))
        conn.commit()
    if conn.execute("SELECT 1 FROM runtime WHERE id = 'singleton'").fetchone() is None:
        conn.execute("INSERT INTO runtime VALUES ('singleton', ?)", (json.dumps(DEFAULT_RUNTIME),))
        conn.commit()
    conn.close()


def insert_signal(signal: dict):
    conn = _conn()
    conn.execute(
        "INSERT OR REPLACE INTO signals VALUES (?, ?, ?)",
        (signal["id"], signal["receivedAt"], json.dumps(signal)),
    )
    conn.commit()
    conn.close()


def list_signals() -> list[dict]:
    conn = _conn()
    rows = conn.execute("SELECT data FROM signals ORDER BY receivedAt DESC").fetchall()
    conn.close()
    return [json.loads(r["data"]) for r in rows]


def get_signal(signal_id: str) -> dict | None:
    conn = _conn()
    row = conn.execute("SELECT data FROM signals WHERE id = ?", (signal_id,)).fetchone()
    conn.close()
    return json.loads(row["data"]) if row else None


def insert_log(log: dict):
    conn = _conn()
    conn.execute("INSERT OR REPLACE INTO logs VALUES (?, ?, ?)", (log["id"], log["at"], json.dumps(log)))
    conn.commit()
    conn.close()


def list_logs() -> list[dict]:
    conn = _conn()
    rows = conn.execute("SELECT data FROM logs ORDER BY at DESC").fetchall()
    conn.close()
    return [json.loads(r["data"]) for r in rows]


def insert_position(position: dict):
    conn = _conn()
    conn.execute("INSERT OR REPLACE INTO positions VALUES (?, ?)", (position["id"], json.dumps(position)))
    conn.commit()
    conn.close()


def delete_position(position_id: str):
    conn = _conn()
    conn.execute("DELETE FROM positions WHERE id = ?", (position_id,))
    conn.commit()
    conn.close()


def list_positions() -> list[dict]:
    conn = _conn()
    rows = conn.execute("SELECT data FROM positions").fetchall()
    conn.close()
    return [json.loads(r["data"]) for r in rows]


def get_position(position_id: str) -> dict | None:
    conn = _conn()
    row = conn.execute("SELECT data FROM positions WHERE id = ?", (position_id,)).fetchone()
    conn.close()
    return json.loads(row["data"]) if row else None


def insert_trade(trade: dict):
    conn = _conn()
    conn.execute("INSERT OR REPLACE INTO trades VALUES (?, ?)", (trade["id"], json.dumps(trade)))
    conn.commit()
    conn.close()


def list_trades() -> list[dict]:
    conn = _conn()
    rows = conn.execute("SELECT data FROM trades").fetchall()
    conn.close()
    return [json.loads(r["data"]) for r in rows]


def get_trade(trade_id: str) -> dict | None:
    conn = _conn()
    row = conn.execute("SELECT data FROM trades WHERE id = ?", (trade_id,)).fetchone()
    conn.close()
    return json.loads(row["data"]) if row else None


def get_settings() -> dict:
    conn = _conn()
    row = conn.execute("SELECT data FROM settings WHERE id = 'singleton'").fetchone()
    conn.close()
    return json.loads(row["data"])


def update_settings(patch: dict) -> dict:
    validate_settings_patch(patch)
    current = get_settings()
    current.update(patch)
    conn = _conn()
    conn.execute("UPDATE settings SET data = ? WHERE id = 'singleton'", (json.dumps(current),))
    conn.commit()
    conn.close()
    return current


def get_runtime_state() -> dict:
    conn = _conn()
    row = conn.execute("SELECT data FROM runtime WHERE id = 'singleton'").fetchone()
    conn.close()
    return json.loads(row["data"])


def save_runtime_state(state: dict):
    conn = _conn()
    conn.execute("UPDATE runtime SET data = ? WHERE id = 'singleton'", (json.dumps(state),))
    conn.commit()
    conn.close()
