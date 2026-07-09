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


def test_signup_and_signin_user(tmp_path, monkeypatch):
    database_path = tmp_path / "prelegal.sqlite3"
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(database_path))

    with TestClient(app) as client:
        signup_response = client.post(
            "/api/signup",
            json={
                "email": "founder@example.com",
                "display_name": "Founder",
                "password": "secret123",
            },
        )
        signin_response = client.post(
            "/api/signin",
            json={
                "email": "founder@example.com",
                "password": "secret123",
            },
        )
        failed_signin_response = client.post(
            "/api/signin",
            json={
                "email": "founder@example.com",
                "password": "wrong123",
            },
        )

    assert signup_response.status_code == 200
    assert signup_response.json()["user"] == {
        "id": 1,
        "email": "founder@example.com",
        "displayName": "Founder",
    }
    assert signin_response.status_code == 200
    assert signin_response.json()["user"] == signup_response.json()["user"]
    assert failed_signin_response.status_code == 401


def test_signup_rejects_duplicate_email(tmp_path, monkeypatch):
    database_path = tmp_path / "prelegal.sqlite3"
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(database_path))

    payload = {
        "email": "founder@example.com",
        "display_name": "Founder",
        "password": "secret123",
    }

    with TestClient(app) as client:
        first_response = client.post("/api/signup", json=payload)
        second_response = client.post("/api/signup", json=payload)

    assert first_response.status_code == 200
    assert second_response.status_code == 409


def test_user_can_save_and_read_documents(tmp_path, monkeypatch):
    database_path = tmp_path / "prelegal.sqlite3"
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(database_path))

    with TestClient(app) as client:
        signup_response = client.post(
            "/api/signup",
            json={
                "email": "founder@example.com",
                "display_name": "Founder",
                "password": "secret123",
            },
        )
        user_id = signup_response.json()["user"]["id"]
        save_response = client.post(
            "/api/documents",
            json={
                "user_id": user_id,
                "title": "Cloud Service Agreement",
                "document_type": "cloud-service-agreement",
                "content": "# Cloud Service Agreement",
                "values": {"partyOneName": "Northstar Labs, Inc."},
            },
        )
        list_response = client.get(f"/api/users/{user_id}/documents")
        read_response = client.get(f"/api/users/{user_id}/documents/1")

    assert save_response.status_code == 200
    assert save_response.json()["document"]["title"] == "Cloud Service Agreement"
    assert list_response.status_code == 200
    assert list_response.json()["documents"] == [
        {
            "id": 1,
            "title": "Cloud Service Agreement",
            "documentType": "cloud-service-agreement",
            "createdAt": save_response.json()["document"]["createdAt"],
        },
    ]
    assert read_response.status_code == 200
    assert read_response.json()["document"]["values"] == {
        "partyOneName": "Northstar Labs, Inc.",
    }
