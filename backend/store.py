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
        """
    )
    conn.commit()
    if conn.execute("SELECT 1 FROM settings WHERE id = 'singleton'").fetchone() is None:
        conn.execute("INSERT INTO settings VALUES ('singleton', ?)", (json.dumps(DEFAULT_SETTINGS),))
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
    current = get_settings()
    current.update(patch)
    conn = _conn()
    conn.execute("UPDATE settings SET data = ? WHERE id = 'singleton'", (json.dumps(current),))
    conn.commit()
    conn.close()
    return current
