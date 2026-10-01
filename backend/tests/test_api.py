from fastapi.testclient import TestClient

import auth
import main
import store


def _client():
    return TestClient(main.app)


def test_get_settings_returns_defaults():
    resp = _client().get("/api/settings")
    assert resp.status_code == 200
    assert resp.json()["mode"] == "PAPER"


def test_put_settings_requires_admin_token():
    resp = _client().put("/api/settings", json={"maxDailyLoss": 8000})
    assert resp.status_code == 401


def test_put_settings_applies_partial_patch_with_valid_token():
    resp = _client().put(
        "/api/settings",
        json={"maxDailyLoss": 8000},
        headers={"X-Admin-Token": auth.ADMIN_API_TOKEN},
    )
    assert resp.status_code == 200
    assert resp.json()["maxDailyLoss"] == 8000
    assert resp.json()["mode"] == "PAPER"  # untouched fields survive the patch


def test_put_settings_rejects_out_of_bounds_value():
    resp = _client().put(
        "/api/settings",
        json={"maxDailyLoss": 1},
        headers={"X-Admin-Token": auth.ADMIN_API_TOKEN},
    )
    assert resp.status_code == 400


def test_get_signal_404_for_unknown_id():
    resp = _client().get("/api/signals/does-not-exist")
    assert resp.status_code == 404


def test_system_action_emergency_stop():
    resp = _client().post(
        "/api/system/actions",
        json={"action": "EMERGENCY_STOP"},
        headers={"X-Admin-Token": auth.ADMIN_API_TOKEN},
    )
    assert resp.status_code == 200
    assert resp.json()["accepted"] is True
    assert store.get_runtime_state()["emergencyStopped"] is True
