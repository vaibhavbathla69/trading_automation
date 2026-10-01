# Backend

FastAPI service implementing the REST/SSE contract from the root README against real Telegram signals.

## Setup

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env   # fill in TG_API_ID, TG_API_HASH, TG_PHONE, TG_CHANNEL
.venv/bin/python -m uvicorn main:app --reload --port 8000
```

First run needs an interactive Telegram login (OTP, possibly 2FA) — run it in a real terminal, not backgrounded.

## What's real vs. not yet

- **Real**: live Telegram listener (Telethon), message parsing into `Signal` (options format: `BUY <UNDERLYING> <MONTH> <STRIKE> <CE|PE> <ABOVE|BELOW|AT> <price>` + `SL`/`TARGET`), SQLite persistence, all REST endpoints, SSE event stream, admin actions.
- **Not implemented yet**: broker connection, order execution, paper fill simulation, live LTP/market data feed. Positions and trades endpoints are real (SQLite-backed) but stay empty until an execution engine exists to populate them — that's the next phase, not faked here.
- Expiry-date resolution (`parser.py`) hardcodes the Thursday-expiry NSE convention with no holiday calendar — good enough for scaffolding, revisit before this drives real execution.
- `TG_CHANNEL` currently points at a test/dev channel with plain equity-format messages (not the options format above), used only to prove the ingest → store → API → SSE pipeline end to end. Point it at the real signal source once that channel/account is available — no code change needed, just `.env`.

## Production deploy

- Pin deps: `requirements.txt` is now version-pinned, not loose.
- Set `ADMIN_API_TOKEN`, `FRONTEND_ORIGINS` (comma-separated real frontend origin(s), no `*`), `ADMIN_ALERT_CHAT` in `.env`.
- Run under a supervisor so a crash doesn't leave positions unmanaged: `deploy/algotrade.service` (systemd, `Restart=always`). Copy to `/etc/systemd/system/`, fix paths, `systemctl enable --now algotrade`.
- Run behind TLS (nginx/caddy reverse proxy) — the app itself serves plain HTTP.

## Frontend wiring

Frontend currently calls in-memory mock modules under `src/api/`. Point those at `http://localhost:8000/api/...` (see the endpoint table in the root README) to go live — the response shapes already match `src/types.ts`.
