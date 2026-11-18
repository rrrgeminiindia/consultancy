from company_api.main import app
from fastapi.testclient import TestClient


def test_liveness() -> None:
    response = TestClient(app).get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "company-api", "database": None}
