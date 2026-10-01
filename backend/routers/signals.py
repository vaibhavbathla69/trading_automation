from fastapi import APIRouter, HTTPException

import store
from models import Signal

router = APIRouter(prefix="/api/signals", tags=["signals"])


@router.get("", response_model=list[Signal])
def list_signals():
    return store.list_signals()


@router.get("/{signal_id}", response_model=Signal)
def get_signal(signal_id: str):
    signal = store.get_signal(signal_id)
    if not signal:
        raise HTTPException(404, "signal not found")
    return signal
