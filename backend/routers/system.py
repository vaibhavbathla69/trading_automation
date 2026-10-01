from datetime import date, datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

import alerts
import broker
import realtime
import runtime_state
import store
import telegram_listener
from auth import require_admin_token
from models import AdminActionRequest, AdminActionResponse, SystemLog, SystemStatus

router = APIRouter(prefix="/api/system", tags=["system"])


def get_system_status() -> dict:
    settings = store.get_settings()
    tg_state = telegram_listener.get_state()
    broker_state = broker.get_state()
    broker_status = "CONNECTED" if broker_state["connected"] else "DISCONNECTED"
    now = datetime.now(timezone.utc).astimezone().isoformat()
    health = (
        "CRITICAL" if runtime_state.state["emergencyStopped"]
        else "HEALTHY" if tg_state["connected"] and broker_state["connected"]
        else "DEGRADED"
    )
    return {
        "mode": settings["mode"],
        "tradingEnabled": runtime_state.state["tradingEnabled"],
        "autoExecutionEnabled": runtime_state.state["autoExecutionEnabled"],
        "emergencyStopped": runtime_state.state["emergencyStopped"],
        "broker": {"name": settings["broker"], "state": broker_status, "checkedAt": now},
        "telegram": {"name": settings["telegramSource"], "state": "CONNECTED" if tg_state["connected"] else "DISCONNECTED", "checkedAt": now},
        "marketData": {"name": "Angel One LTP feed", "state": broker_status, "checkedAt": now},
        "lastSignalAt": tg_state["last_signal_at"],
        "backendAvailable": True,
        "health": health,
        "sessionDate": date.today().isoformat(),
    }


@router.get("/status", response_model=SystemStatus)
def system_status():
    return get_system_status()


@router.get("/logs", response_model=list[SystemLog])
def system_logs():
    return store.list_logs()


@router.post("/actions", response_model=AdminActionResponse, dependencies=[Depends(require_admin_token)])
def system_action(body: AdminActionRequest):
    action = body.action
    request_id = f"act_{uuid4().hex[:8]}"

    if action == "PAUSE_NEW_TRADES":
        runtime_state.set(tradingEnabled=False)
    elif action == "RESUME_NEW_TRADES":
        runtime_state.set(tradingEnabled=True)
    elif action == "DISABLE_AUTO_EXECUTION":
        runtime_state.set(autoExecutionEnabled=False)
    elif action == "ENABLE_AUTO_EXECUTION":
        runtime_state.set(autoExecutionEnabled=True)
    elif action == "EMERGENCY_STOP":
        runtime_state.set(tradingEnabled=False, autoExecutionEnabled=False, emergencyStopped=True)
        alerts.notify("EMERGENCY STOP triggered. Trading halted.")
    elif action == "CLOSE_ALL_POSITIONS":
        pass  # ponytail: no execution engine yet, nothing to close — see backend/README gap notes
    else:
        raise HTTPException(400, f"unknown action {action!r}")

    log_entry = {
        "id": f"log_{uuid4().hex[:8]}", "at": datetime.now(timezone.utc).astimezone().isoformat(),
        "level": "SYSTEM", "message": f"Admin action: {action}", "detail": None,
        "signalId": None, "positionId": None,
    }
    store.insert_log(log_entry)
    realtime.broadcast("log.created", log_entry)
    realtime.broadcast("system.updated", get_system_status())

    return {"requestId": request_id, "accepted": True, "message": f"{action} applied"}
