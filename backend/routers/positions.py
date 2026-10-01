from fastapi import APIRouter, HTTPException

import store
from models import Position

router = APIRouter(prefix="/api/positions", tags=["positions"])


@router.get("", response_model=list[Position])
def list_positions():
    return store.list_positions()


@router.get("/{position_id}", response_model=Position)
def get_position(position_id: str):
    position = store.get_position(position_id)
    if not position:
        raise HTTPException(404, "position not found")
    return position
