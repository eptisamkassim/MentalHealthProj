"""Smoke tests using FastAPI TestClient with an in-memory SQLite DB."""


class TestHealth:
    def test_health_returns_200(self, client):
        r = client.get("/health")
        assert r.status_code == 200


class TestChatMessageValidation:
    def test_missing_user_id_returns_422(self, client):
        r = client.post("/api/chat/message", json={"message": "hello"})
        assert r.status_code == 422

    def test_missing_message_returns_422(self, client):
        r = client.post("/api/chat/message", json={"user_id": "abc"})
        assert r.status_code == 422


