import os
from datetime import datetime, timezone

from telethon import TelegramClient, events

import realtime
import store
from parser import parse_message

API_ID = int(os.environ["TG_API_ID"])
API_HASH = os.environ["TG_API_HASH"]
PHONE = os.environ["TG_PHONE"]
CHANNEL = os.environ["TG_CHANNEL"]

_state = {"connected": False, "last_signal_at": None}


def get_state() -> dict:
    return dict(_state)


async def _resolve_channel(client):
    if CHANNEL.startswith("@"):
        return await client.get_entity(CHANNEL)
    target_id = int(CHANNEL) if CHANNEL.lstrip("-").isdigit() else None
    async for dialog in client.iter_dialogs():
        if target_id is not None and dialog.entity.id == target_id:
            return dialog.entity
        if dialog.name and dialog.name.strip().lower() == CHANNEL.strip().lower():
            return dialog.entity
    raise ValueError(f"No dialog found matching {CHANNEL!r}")


def _log(level: str, message: str, detail: str | None = None, signal_id: str | None = None):
    from uuid import uuid4
    log = {
        "id": f"log_{uuid4().hex[:8]}",
        "at": datetime.now(timezone.utc).astimezone().isoformat(),
        "level": level,
        "message": message,
        "detail": detail,
        "signalId": signal_id,
        "positionId": None,
    }
    store.insert_log(log)
    realtime.broadcast("log.created", log)


async def start():
    client = TelegramClient("algotrade_session", API_ID, API_HASH)
    await client.start(phone=PHONE)
    entity = await _resolve_channel(client)
    _state["connected"] = True

    @client.on(events.NewMessage(chats=entity))
    async def handler(event):
        if not event.message.text:
            return
        received_at = event.message.date.astimezone().isoformat()
        settings = store.get_settings()
        signal = parse_message(event.message.text, settings["telegramSource"], received_at, settings["broker"])
        if signal is None:
            return
        store.insert_signal(signal)
        realtime.broadcast("signal.updated", signal)
        _state["last_signal_at"] = signal["receivedAt"]
        if signal["status"] == "MANUAL_REVIEW":
            _log("WARNING", "Signal requires manual review", signal["rejectionReason"], signal["id"])
        else:
            _log("INFO", "Signal parsed", f"{signal['underlying']} {signal['strike']} {signal['optionType']}", signal["id"])

    return client
