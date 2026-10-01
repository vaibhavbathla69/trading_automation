import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# dummy creds so importing broker/telegram_listener modules doesn't KeyError — tests never
# actually hit these APIs
for key in ("ANGEL_API_KEY", "ANGEL_CLIENT_CODE", "ANGEL_PIN", "ANGEL_TOTP_SECRET",
            "TG_API_ID", "TG_API_HASH", "TG_PHONE", "ADMIN_API_TOKEN"):
    os.environ.setdefault(key, "0" if key == "TG_API_ID" else "test")

import store


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    """Every test gets its own SQLite file — no shared state, no cleanup needed."""
    monkeypatch.setattr(store, "DB_PATH", str(tmp_path / "test.db"))
    store.init_db()
    yield
