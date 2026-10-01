import asyncio
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import alerts
import broker
import instruments
import market_data
import runtime_state
import store
import telegram_listener
from routers import events, positions, settings, signals, system, trades

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)

FRONTEND_ORIGINS = [o.strip() for o in os.environ.get("FRONTEND_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
SCRIP_MASTER_REFRESH_SECONDS = 24 * 60 * 60

_telegram_client = None
_market_data_task = None
_scrip_refresh_task = None


async def _refresh_scrip_master_periodically():
    while True:
        await asyncio.sleep(SCRIP_MASTER_REFRESH_SECONDS)
        instruments.load(force=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _telegram_client, _market_data_task, _scrip_refresh_task
    store.init_db()
    runtime_state.load()
    instruments.load()
    broker.login()
    _telegram_client = await telegram_listener.start()
    alerts.set_client(_telegram_client)
    _market_data_task = asyncio.create_task(market_data.run())
    _scrip_refresh_task = asyncio.create_task(_refresh_scrip_master_periodically())
    log.info("AlgoTrade backend started")
    yield
    _market_data_task.cancel()
    _scrip_refresh_task.cancel()
    if _telegram_client:
        await _telegram_client.disconnect()
    log.info("AlgoTrade backend shut down")


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,  # set FRONTEND_ORIGINS env to the real frontend origin(s) in prod
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(signals.router)
app.include_router(positions.router)
app.include_router(trades.router)
app.include_router(settings.router)
app.include_router(system.router)
app.include_router(events.router)
