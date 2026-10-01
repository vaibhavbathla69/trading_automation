import json
import os
import time
import urllib.request
from datetime import date, datetime

SCRIP_MASTER_URL = "https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json"
CACHE_PATH = os.path.join(os.path.dirname(__file__), "scrip_master.json")
MAX_CACHE_AGE_SECONDS = 24 * 60 * 60

_index: dict[tuple, tuple] = {}
_expiries: dict[str, list[str]] = {}


def _parse_expiry(raw: str) -> str | None:
    try:
        return datetime.strptime(raw, "%d%b%Y").date().isoformat()
    except ValueError:
        return None


def _is_stale() -> bool:
    if not os.path.exists(CACHE_PATH):
        return True
    return time.time() - os.path.getmtime(CACHE_PATH) > MAX_CACHE_AGE_SECONDS


def load(force: bool = False):
    global _index, _expiries
    if force or _is_stale():
        urllib.request.urlretrieve(SCRIP_MASTER_URL, CACHE_PATH)
    with open(CACHE_PATH) as f:
        rows = json.load(f)

    index = {}
    expiries: dict[str, set[str]] = {}
    for row in rows:
        if row.get("exch_seg") != "NFO" or row.get("instrumenttype") not in ("OPTIDX", "OPTSTK"):
            continue
        symbol = row.get("symbol", "")
        if not (symbol.endswith("CE") or symbol.endswith("PE")):
            continue
        expiry = _parse_expiry(row.get("expiry", ""))
        if expiry is None:
            continue
        underlying = row["name"].upper()
        strike = round(float(row["strike"]) / 100, 2)
        key = (underlying, expiry, strike, symbol[-2:])
        index[key] = (row["token"], symbol, row["exch_seg"], int(row["lotsize"]))
        expiries.setdefault(underlying, set()).add(expiry)
    _index = index
    _expiries = {u: sorted(dates) for u, dates in expiries.items()}


def find_token(underlying: str, expiry_iso: str, strike: float, option_type: str):
    return _index.get((underlying.upper(), expiry_iso, round(strike, 2), option_type.upper()))


def resolve_expiry(underlying: str, month_abbr: str, received_at: date) -> str | None:
    """Real expiry date for underlying/month from the scrip master. None if not found (holidays, missing data)."""
    month_num = datetime.strptime(month_abbr[:3].upper(), "%b").month
    year = received_at.year
    if month_num < received_at.month:
        year += 1
    candidates = [
        d for d in _expiries.get(underlying.upper(), [])
        if date.fromisoformat(d).year == year and date.fromisoformat(d).month == month_num
    ]
    if not candidates:
        return None
    received_iso = received_at.isoformat()
    upcoming = [d for d in candidates if d >= received_iso]
    return min(upcoming) if upcoming else max(candidates)
