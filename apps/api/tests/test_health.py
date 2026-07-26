from fastapi.testclient import TestClient

from app.main import app


def test_openapi_contains_versioned_health() -> None:
    client = TestClient(app)
    schema = client.get("/openapi.json")
    assert schema.status_code == 200
    assert "/api/v1/health" in schema.json()["paths"]
