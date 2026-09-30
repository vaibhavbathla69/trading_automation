import asyncio
import json
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from uuid import uuid4

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import realtime
import store
import telegram_listener

runtime_state = {"tradingEnabled": True, "autoExecutionEnabled": True, "emergencyStopped": False}
_telegram_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _telegram_client
    store.init_db()
    _telegram_client = await telegram_listener.start()
    yield
    if _telegram_client:
        await _telegram_client.disconnect()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ponytail: dev-only, restrict before any real deploy
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/signals")
def list_signals():
    return store.list_signals()


@app.get("/api/signals/{signal_id}")
def get_signal(signal_id: str):
    signal = store.get_signal(signal_id)
    if not signal:
        raise HTTPException(404, "signal not found")
    return signal


@app.get("/api/positions")
def list_positions():
    return store.list_positions()


@app.get("/api/positions/{position_id}")
def get_position(position_id: str):
    position = store.get_position(position_id)
    if not position:
        raise HTTPException(404, "position not found")
    return position


@app.get("/api/trades")
def list_trades():
    return store.list_trades()


@app.get("/api/trades/{trade_id}")
def get_trade(trade_id: str):
    trade = store.get_trade(trade_id)
    if not trade:
        raise HTTPException(404, "trade not found")
    return trade


@app.get("/api/settings")
def get_settings():
    return store.get_settings()


@app.put("/api/settings")
def put_settings(patch: dict):
    updated = store.update_settings(patch)
    realtime.broadcast("system.updated", _system_status())
    return updated


@app.get("/api/system/status")
def system_status():
    return _system_status()


@app.get("/api/system/logs")
def system_logs():
    return store.list_logs()


@app.post("/api/system/actions")
def system_action(body: dict):
    action = body.get("action")
    request_id = f"act_{uuid4().hex[:8]}"

    if action == "PAUSE_NEW_TRADES":
        runtime_state["tradingEnabled"] = False
    elif action == "RESUME_NEW_TRADES":
        runtime_state["tradingEnabled"] = True
    elif action == "DISABLE_AUTO_EXECUTION":
        runtime_state["autoExecutionEnabled"] = False
    elif action == "ENABLE_AUTO_EXECUTION":
        runtime_state["autoExecutionEnabled"] = True
    elif action == "EMERGENCY_STOP":
        runtime_state.update(tradingEnabled=False, autoExecutionEnabled=False, emergencyStopped=True)
    elif action == "CLOSE_ALL_POSITIONS":
        pass  # ponytail: no execution engine yet, nothing to close — see backend/README gap notes
    else:
        raise HTTPException(400, f"unknown action {action!r}")

    log = {
        "id": f"log_{uuid4().hex[:8]}", "at": datetime.now(timezone.utc).astimezone().isoformat(),
        "level": "SYSTEM", "message": f"Admin action: {action}", "detail": None,
        "signalId": None, "positionId": None,
    }
    store.insert_log(log)
    realtime.broadcast("log.created", log)
    realtime.broadcast("system.updated", _system_status())

    return {"requestId": request_id, "accepted": True, "message": f"{action} applied"}


@app.get("/api/events")
async def events():
    async def stream():
        q = realtime.subscribe()
        try:
            while True:
                payload = await q.get()
                yield f"data: {payload}\n\n"
        finally:
            realtime.unsubscribe(q)

    return StreamingResponse(stream(), media_type="text/event-stream")


def _system_status() -> dict:
    settings = store.get_settings()
    tg_state = telegram_listener.get_state()
    now = datetime.now(timezone.utc).astimezone().isoformat()
    health = "CRITICAL" if runtime_state["emergencyStopped"] else ("HEALTHY" if tg_state["connected"] else "DEGRADED")
    return {
        "mode": settings["mode"],
        "tradingEnabled": runtime_state["tradingEnabled"],
        "autoExecutionEnabled": runtime_state["autoExecutionEnabled"],
        "emergencyStopped": runtime_state["emergencyStopped"],
        "broker": {"name": settings["broker"], "state": "DISCONNECTED", "checkedAt": now},
        "telegram": {"name": settings["telegramSource"], "state": "CONNECTED" if tg_state["connected"] else "DISCONNECTED", "checkedAt": now},
        "marketData": {"name": "Market feed", "state": "DISCONNECTED", "checkedAt": now},
        "lastSignalAt": tg_state["last_signal_at"],
        "backendAvailable": True,
        "health": health,
        "sessionDate": date.today().isoformat(),
    }
