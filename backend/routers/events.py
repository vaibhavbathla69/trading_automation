from fastapi import APIRouter
from fastapi.responses import StreamingResponse

import realtime

router = APIRouter(tags=["events"])


@router.get("/api/events")
async def events():
    async def stream():
        q = realtime.subscribe()
        try:
            while True:
                payload = await q.get()
                yield f"data: {payload}\n\n"
        finally:
            realtime.unsubscribe(q)

    return StreamingResponse(stream(), media_type="text/event-stream")
