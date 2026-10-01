from fastapi import APIRouter, Depends, HTTPException

import realtime
import store
from auth import require_admin_token
from models import TradingSettings, TradingSettingsPatch
from routers.system import get_system_status

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=TradingSettings)
def get_settings():
    return store.get_settings()


@router.put("", response_model=TradingSettings, dependencies=[Depends(require_admin_token)])
def put_settings(patch: TradingSettingsPatch):
    try:
        updated = store.update_settings(patch.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    realtime.broadcast("system.updated", get_system_status())
    return updated
