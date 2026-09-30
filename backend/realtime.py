import asyncio
import json

_subscribers: list[asyncio.Queue] = []


def subscribe() -> asyncio.Queue:
    q = asyncio.Queue()
    _subscribers.append(q)
    return q


def unsubscribe(q: asyncio.Queue):
    _subscribers.remove(q)


def broadcast(event_type: str, data: dict):
    payload = json.dumps({"type": event_type, "data": data})
    for q in list(_subscribers):
        q.put_nowait(payload)
