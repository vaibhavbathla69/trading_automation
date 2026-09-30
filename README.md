# Meridian trading operations console

Frontend-only admin dashboard for monitoring Telegram trading signals and configuring the rules used by a separate trading backend. The sample data is a fixed 30 September 2026 session in Indian Standard Time. No Telegram listener, broker connection, order execution, or market feed is implemented here.

The [design review](docs/design-review.md) records the CRM research, dashboard choices, and status color language.

## Run

```bash
npm install
npm run dev
```

Use `npm run build` for a TypeScript checked production build.

## Structure

- `src/types.ts`: shared domain contracts for signals, positions, trades, orders, settings, system status, logs, timelines, and real-time events.
- `src/api/`: domain APIs returning mock responses. Views call these modules only; mock records are isolated in `mockData.ts`.
- `src/api/realtime.ts`: subscription boundary for future WebSocket or SSE events. The current adapter emits mock admin control status changes and invents no prices, signals, or fills.
- `src/components/`: badges, status and metric cards, tables, confirmation modal, timelines, and detail drawers.
- `src/pages/`: overview, signals, positions, trade history, system logs, and trading rules.

## Backend handoff

The exported TypeScript interfaces in `src/types.ts` are the frontend contract. Preserve those response shapes or update the type and adapter together. Suggested endpoints:

| Frontend method | Suggested endpoint | Response |
| --- | --- | --- |
| `signalsApi.list/get` | `GET /api/signals`, `GET /api/signals/:id` | `Signal[]`, `Signal` |
| `positionsApi.list/get` | `GET /api/positions`, `GET /api/positions/:id` | `Position[]`, `Position` |
| `tradesApi.list/get` | `GET /api/trades`, `GET /api/trades/:id` | `Trade[]`, `Trade` |
| `settingsApi.get/update` | `GET /api/settings`, `PUT /api/settings` | `TradingSettings` |
| `systemApi.getStatus` | `GET /api/system/status` | `SystemStatus` |
| `systemApi.getLogs` | `GET /api/system/logs` | `SystemLog[]` |
| `systemApi.requestAction` | `POST /api/system/actions` | `AdminActionResponse` |
| `realtimeApi.subscribe` | `GET /api/events` (SSE) or WebSocket | `RealtimeEvent` union |

For actions, send `{ "action": "PAUSE_NEW_TRADES" }` (or another `AdminAction`) and return `{ requestId, accepted, message }`. The backend must enforce permissions, idempotency, risk limits, action results, and actual broker outcomes. An accepted request is not proof of a fill or exit; subsequent status, position, order, and log events should reflect the real result.

All timestamps are ISO 8601 strings with an offset. The UI displays timestamps in `Asia/Kolkata`; prices and P&L use INR. The backend should send authoritative LTP, P&L, connection state, status transitions, and event timelines. Critical failures should appear in system status and logs, including disconnections, order rejection, invalid contracts, insufficient funds, stale or duplicate signals, and ambiguous parsing.

The current mock API is in memory, so saved settings and control state reset on reload. Admin controls require UI confirmation and only record mock requests. Close all does not change the mock positions because no order execution exists.
