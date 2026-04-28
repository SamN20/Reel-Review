from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_url():
    response = client.get("/api/v1/auth/login-url")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "client_id=" in data["url"]
    assert "redirect_uri=" in data["url"]
