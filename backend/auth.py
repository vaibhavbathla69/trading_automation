import hmac
import logging
import os
import time

from fastapi import Header, HTTPException, Request

log = logging.getLogger(__name__)

ADMIN_API_TOKEN = os.environ["ADMIN_API_TOKEN"]
AUTH_MAX_FAILURES = 5
AUTH_LOCKOUT_SECONDS = 300

_auth_failures: dict[str, list[float]] = {}  # client host -> recent failure timestamps


def require_admin_token(request: Request, x_admin_token: str = Header(default="")):
    host = request.client.host if request.client else "unknown"
    now = time.monotonic()
    failures = [t for t in _auth_failures.get(host, []) if now - t < AUTH_LOCKOUT_SECONDS]
    if len(failures) >= AUTH_MAX_FAILURES:
        raise HTTPException(429, "too many failed auth attempts, try again later")

    if not hmac.compare_digest(x_admin_token, ADMIN_API_TOKEN):
        failures.append(now)
        _auth_failures[host] = failures
        if len(failures) >= AUTH_MAX_FAILURES:
            log.warning("admin auth lockout triggered for host %s", host)
        raise HTTPException(401, "invalid or missing X-Admin-Token")
    _auth_failures.pop(host, None)
