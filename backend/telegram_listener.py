import os
from datetime import datetime, timezone
from parser import parse_message

from telethon import TelegramClient, events

import realtime
import store

API_ID = int(os.environ["TG_API_ID"])
API_HASH = os.environ["TG_API_HASH"]
PHONE = os.environ["TG_PHONE"]

# TG_CHANNELS="2234701728:Mani Telegram,@someoneelse:Other Channel" — one Telegram user account
# can sit in many chats, so adding a second/third signal source is just another env entry, no
# second login. Falls back to single TG_CHANNEL (labelled from settings.telegramSource) if unset,
# so an existing deployment's .env keeps working untouched.
RAW_CHANNELS = os.environ.get("TG_CHANNELS", "")
LEGACY_CHANNEL = os.environ.get("TG_CHANNEL", "")

_state = {"connected": False, "last_signal_at": None}


def get_state() -> dict:
    return dict(_state)


def _configured_channels() -> dict[str, str | None]:
    if RAW_CHANNELS:
        pairs = (p.split(":", 1) for p in RAW_CHANNELS.split(",") if p.strip())
        return {ident.strip(): label.strip() for ident, label in pairs}
    return {LEGACY_CHANNEL: None}  # None label -> resolved from settings.telegramSource at parse time


async def _resolve_channel(client, ident: str):
    if ident.startswith("@"):
        return await client.get_entity(ident)
    target_id = int(ident) if ident.lstrip("-").isdigit() else None
    async for dialog in client.iter_dialogs():
        if target_id is not None and dialog.entity.id == target_id:
            return dialog.entity
        if dialog.name and dialog.name.strip().lower() == ident.strip().lower():
            return dialog.entity
    raise ValueError(f"No dialog found matching {ident!r}")


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

    source_by_chat_id = {}
    for ident, label in _configured_channels().items():
        entity = await _resolve_channel(client, ident)
        source_by_chat_id[entity.id] = label
    _state["connected"] = True

    @client.on(events.NewMessage(chats=list(source_by_chat_id.keys())))
    async def handler(event):
        if not event.message.text:
            return
        settings = store.get_settings()
        source = source_by_chat_id.get(event.chat_id) or settings["telegramSource"]
        received_at = event.message.date.astimezone().isoformat()
        signal = parse_message(event.message.text, source, received_at, settings["broker"])
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
