from fastapi import APIRouter, HTTPException

import store
from models import Trade

router = APIRouter(prefix="/api/trades", tags=["trades"])


@router.get("", response_model=list[Trade])
def list_trades():
    return store.list_trades()


@router.get("/{trade_id}", response_model=Trade)
def get_trade(trade_id: str):
    trade = store.get_trade(trade_id)
    if not trade:
        raise HTTPException(404, "trade not found")
    return trade
