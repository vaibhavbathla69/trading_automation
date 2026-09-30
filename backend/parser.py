import calendar
import re
from datetime import date, timedelta
from uuid import uuid4

MONTHS = {m.upper(): i for i, m in enumerate(calendar.month_abbr) if m}
INDEX_WEEKLY = {"NIFTY", "BANKNIFTY", "FINNIFTY", "SENSEX", "MIDCPNIFTY"}

BUY_RE = re.compile(
    r"BUY\s+(?P<underlying>[A-Z]+)\s+(?P<month>[A-Z]{3})\s+(?P<strike>[\d.]+)\s+"
    r"(?P<opt>CE|PE)\s+(?P<entrytype>ABOVE|BELOW|AT)\s+(?P<entry>[\d.]+)",
    re.IGNORECASE,
)
SL_RE = re.compile(r"SL\s+([\d.]+)", re.IGNORECASE)
TARGET_RE = re.compile(r"TARGET\s+([\d.]+)(?:\s*\.{2,}\s*([\d.]+))?", re.IGNORECASE)


def _last_weekday_of_month(year: int, month: int, weekday: int) -> date:
    last_day = calendar.monthrange(year, month)[1]
    d = date(year, month, last_day)
    while d.weekday() != weekday:
        d -= timedelta(days=1)
    return d


def _next_weekday_on_or_after(d: date, weekday: int) -> date:
    days_ahead = (weekday - d.weekday()) % 7
    return d + timedelta(days=days_ahead)


def resolve_expiry(underlying: str, month_abbr: str, received_at: date) -> str:
    # ponytail: NSE expiry-day-of-week convention hardcoded (Thursday), no holiday calendar.
    # Revisit against the real exchange calendar before this feeds live execution.
    month_num = MONTHS[month_abbr.upper()]
    year = received_at.year
    if month_num < received_at.month:
        year += 1
    if underlying.upper() in INDEX_WEEKLY:
        candidate = _next_weekday_on_or_after(received_at, weekday=3)
        if candidate.month != month_num:
            candidate = _last_weekday_of_month(year, month_num, weekday=3)
        return candidate.isoformat()
    return _last_weekday_of_month(year, month_num, weekday=3).isoformat()


def parse_message(text: str, source: str, received_at_iso: str, broker: str) -> dict | None:
    match = BUY_RE.search(text)
    if not match:
        return None

    received_date = date.fromisoformat(received_at_iso[:10])
    sl_match = SL_RE.search(text)
    target_match = TARGET_RE.search(text)

    entry_price = float(match["entry"])
    stop_loss = float(sl_match[1]) if sl_match else entry_price
    target_min = float(target_match[1]) if target_match else entry_price
    target_max = float(target_match[2]) if target_match and target_match[2] else None

    missing = []
    if not sl_match:
        missing.append("stop loss")
    if not target_match:
        missing.append("target")

    confidence = 0.99 if not missing else (0.9 if len(missing) == 1 else 0.5)
    needs_review = confidence < 0.7

    signal_id = f"sig_{uuid4().hex[:8]}"
    timeline = [
        {"id": f"e_{uuid4().hex[:6]}", "at": received_at_iso, "title": "Signal received"},
    ]
    if needs_review:
        status, outcome = "MANUAL_REVIEW", "MANUAL_REVIEW"
        resulting_action = "Awaiting manual review"
        rejection_reason = f"Ambiguous or missing: {', '.join(missing)}"
        timeline.append({"id": f"e_{uuid4().hex[:6]}", "at": received_at_iso, "title": "Requires manual review", "level": "WARNING"})
    else:
        status, outcome = "WAITING_FOR_ENTRY", "WAITING"
        resulting_action = "Monitoring entry"
        rejection_reason = None
        timeline.append({"id": f"e_{uuid4().hex[:6]}", "at": received_at_iso, "title": "Parsed successfully"})

    return {
        "id": signal_id,
        "receivedAt": received_at_iso,
        "source": source,
        "rawMessage": text,
        "underlying": match["underlying"].upper(),
        "expiry": resolve_expiry(match["underlying"], match["month"], received_date),
        "strike": float(match["strike"]),
        "optionType": match["opt"].upper(),
        "action": "BUY",
        "entryType": match["entrytype"].upper(),
        "entryPrice": entry_price,
        "stopLoss": stop_loss,
        "targetMin": target_min,
        "targetMax": target_max,
        "status": status,
        "outcome": outcome,
        "confidence": confidence,
        "ltp": None,
        "broker": broker,
        "rejectionReason": rejection_reason,
        "resultingAction": resulting_action,
        "timeline": timeline,
    }
