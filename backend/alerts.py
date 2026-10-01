import asyncio
import os

ALERT_CHAT = os.environ.get("ADMIN_ALERT_CHAT", "me")  # ponytail: defaults to Telegram "Saved Messages"

_client = None


def set_client(client):
    global _client
    _client = client


def notify(text: str):
    if _client is None:
        return
    try:
        asyncio.get_running_loop().create_task(_client.send_message(ALERT_CHAT, f"[AlgoTrade] {text}"))
    except RuntimeError:
        pass  # no running event loop (e.g. tests) — alert is best-effort, never blocks trading logic
