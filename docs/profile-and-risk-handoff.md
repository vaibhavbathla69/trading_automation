# Profile and risk settings handoff

The frontend currently uses a mock API. Profile details and trading rules are saved in browser storage for the preview; this does not configure or enforce live trading.

## Profile

`UserProfile` in `src/types.ts` contains `fullName`, `email`, `phone`, and `timezone`. Replace `src/api/profile.ts` with authenticated profile GET and update calls. Keep personal details scoped to the signed in user.

## Trading settings

`TradingSettings` now includes `maxCapitalPerTrade` in addition to `capitalPerTrade`, `maxCapitalDeployed`, and `maxDailyLoss`.

- `capitalPerTrade` is the intended allocation when capital sizing is selected.
- `maxCapitalPerTrade` is a hard cap on one new position, regardless of sizing mode.
- `maxCapitalDeployed` is a cap on all open exposure.
- `maxDailyLoss` is the daily loss cutoff. The backend must define the realized versus mark-to-market basis, trading day boundary, and whether it only blocks new entries or exits existing positions. The frontend currently makes no enforcement claim.

Update the backend settings model and validation when connecting the frontend. Validate and enforce every limit on the server before placing orders; frontend validation only helps with data entry.
