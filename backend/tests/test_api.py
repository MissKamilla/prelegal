from fastapi.testclient import TestClient

from prelegal_api.main import app


def test_health_reports_ready_database(tmp_path, monkeypatch):
    database_path = tmp_path / "prelegal.sqlite3"
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(database_path))

    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True, "databaseReady": True}


def test_fake_login_creates_demo_user(tmp_path, monkeypatch):
    database_path = tmp_path / "prelegal.sqlite3"
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(database_path))

    with TestClient(app) as client:
        response = client.post(
            "/api/fake-login",
            json={
                "email": "founder@example.com",
                "display_name": "Founder",
            },
        )

    assert response.status_code == 200
    assert response.json() == {
        "user": {
            "id": 1,
            "email": "founder@example.com",
            "displayName": "Founder",
        },
        "auth": "fake",
    }
