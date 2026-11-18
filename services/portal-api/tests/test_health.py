from fastapi.testclient import TestClient
from portal_api.main import app


def test_liveness() -> None:
    response = TestClient(app).get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "portal-api", "database": None}
