from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_db
from app.models.user import User

client = TestClient(app)

def test_login_url():
    response = client.get("/api/v1/auth/login-url")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "client_id=" in data["url"]
    assert "redirect_uri=" in data["url"]

@patch("app.api.routes.auth.httpx.AsyncClient.get", new_callable=AsyncMock)
@patch("app.api.routes.auth.httpx.AsyncClient.post", new_callable=AsyncMock)
def test_auth_callback_creates_user(mock_post, mock_get, db):
    def override_get_db():
        yield db

    token_response = MagicMock()
    token_response.raise_for_status.return_value = None
    token_response.json.return_value = {"access_token": "keyn-access-token"}
    mock_post.return_value = token_response

    user_response = MagicMock()
    user_response.raise_for_status.return_value = None
    user_response.json.return_value = {
        "id": 999,
        "username": "new-user",
        "email": "new-user@example.com",
    }
    mock_get.return_value = user_response

    app.dependency_overrides[get_db] = override_get_db

    try:
        response = client.post("/api/v1/auth/callback", json={"code": "valid-code"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]

    created_user = db.query(User).filter(User.keyn_id == "999").first()
    assert created_user is not None
    assert created_user.username == "new-user"
