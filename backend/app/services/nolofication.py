import httpx
from typing import List, Optional

from app.core.config import settings

class NoloficationService:
    def __init__(self):
        self.base_url = settings.NOLOFICATION_URL
        self.site_id = settings.NOLOFICATION_SITE_ID
        self.api_key = settings.NOLOFICATION_API_KEY
    
    async def send_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = 'info',
        category: str = None,
        target_url: str = None,
        html_message: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        """Send notification to a single user."""
        url = f"{self.base_url}/api/sites/{self.site_id}/notify"
        
        payload = {
            'user_id': user_id,
            'title': title,
            'message': message,
            'type': notification_type
        }
        
        if category:
            payload['category'] = category
        if target_url:
            payload['target_url'] = target_url
        if html_message:
            payload['html_message'] = html_message
        if metadata:
            payload['metadata'] = metadata
            
        headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"Failed to send notification: {e}")
                return {'success': False, 'error': str(e)}

    async def send_bulk_notification(
        self,
        user_ids: List[str],
        title: str,
        message: str,
        notification_type: str = 'info',
        category: str = None,
        target_url: str = None,
        html_message: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        """Send notification to multiple users."""
        url = f"{self.base_url}/api/sites/{self.site_id}/notify"
        
        payload = {
            'user_ids': user_ids,
            'title': title,
            'message': message,
            'type': notification_type
        }
        
        if category:
            payload['category'] = category
        if target_url:
            payload['target_url'] = target_url
        if html_message:
            payload['html_message'] = html_message
        if metadata:
            payload['metadata'] = metadata
            
        headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers, timeout=30.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                error_detail = str(e)
                if hasattr(e, 'response') and e.response:
                    error_detail = f"{e} - {e.response.text}"
                print(f"Failed to send bulk notification: {error_detail}")
                return {'success': False, 'error': error_detail}

    async def setup_default_categories(self):
        """Register our categories with Nolofication"""
        url = f"{self.base_url}/api/sites/{self.site_id}/categories"
        headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        categories = [
            {
                "key": "weekly_drop",
                "name": "Weekly Drop Alerts",
                "description": "Be notified when a new movie is revealed on Monday",
                "defaults": { "frequency": "instant" }
            },
            {
                "key": "voting_reminders",
                "name": "Voting Reminders",
                "description": "Get reminded to vote before the Sunday deadline",
                "defaults": {
                    "frequency": "weekly",
                    "time_of_day": "12:00",
                    "weekly_day": 6 # Sunday
                }
            },
            {
                "key": "social_interactions",
                "name": "Social Activity",
                "description": "Mentions, replies to reviews, and watch party invites",
                "defaults": { "frequency": "instant" }
            }
        ]
        
        # NOTE: Usually the API needs ADMIN_TOKEN for category creation (per docs),
        # but in many integrations the API Key also works or the admin sets it up manually.
        # Assuming we can run this script to ensure they are created.
        
        async with httpx.AsyncClient() as client:
            for cat in categories:
                try:
                    await client.post(url, json=cat, headers=headers)
                except httpx.HTTPError as e:
                    print(f"Failed to create category {cat['key']}: {e}")

nolofication = NoloficationService()
