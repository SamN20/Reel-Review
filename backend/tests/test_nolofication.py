import pytest
from unittest.mock import AsyncMock, patch
from app.services.nolofication import NoloficationService

@pytest.fixture
def nolo_service():
    return NoloficationService()

@pytest.mark.asyncio
@patch('httpx.AsyncClient.post')
async def test_send_notification(mock_post, nolo_service):
    # Setup mock response
    from unittest.mock import MagicMock
    mock_response = MagicMock()
    mock_response.json.return_value = {"success": True}
    mock_post.return_value = mock_response

    result = await nolo_service.send_notification(
        user_id="test_user",
        title="Test Title",
        message="Test Message",
        category="weekly_drop"
    )

    assert result["success"] is True
    mock_post.assert_called_once()
    
    # Check payload
    call_args = mock_post.call_args
    assert call_args is not None
    
    _, kwargs = call_args
    assert kwargs["json"]["user_id"] == "test_user"
    assert kwargs["json"]["category"] == "weekly_drop"
