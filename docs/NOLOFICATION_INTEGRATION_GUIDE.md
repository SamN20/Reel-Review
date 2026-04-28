# Integrating Nolofication into Your Site

This guide walks you through integrating Nolofication into any of your applications to provide centralized notification management.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Register Your Site](#step-1-register-your-site)
4. [Step 2: Define Notification Categories](#step-2-define-notification-categories)
5. [Step 3: Backend Integration](#step-3-backend-integration)
6. [Step 4: Frontend Integration](#step-4-frontend-integration)
7. [Step 5: Testing](#step-5-testing)
8. [Scheduling & Digests](#scheduling--digests)
9. [Cancelling Pending Notifications](#cancelling-pending-notifications)
10. [Step 6: Advanced Features](#step-6-advanced-features)
11. [HTML Email Support](#html-email-support)

## Overview

Integrating Nolofication provides:
- **Unified notification preferences** - Users set preferences once for all your apps
- **Multi-channel delivery** - Email, web push, Discord, webhooks
- **Centralized management** - All notifications in one place
- **KeyN integration** - Leverages existing authentication
- **Flexible scheduling** - Instant, daily, or weekly notification delivery
- **Category-based control** - Users choose which notification types they want
- **Per-user customization** - Fine-grained control over timing and frequency

## Prerequisites

- Your site must use **KeyN** for authentication
- Backend server capability to make HTTP requests
- (Optional) Frontend for embedded preferences widget
- Access to Nolofication admin to register your site

## Step 1: Register Your Site

### 1.1 Create Site Registration

Contact the Nolofication admin or use the admin CLI:

```bash
# On Nolofication server
cd /path/to/nolofication/backend
source venv/bin/activate
python3 scripts/admin.py create <your-site-id> "Your Site Name" "Brief description"
```

**Parameters:**
- `site_id`: Unique identifier (lowercase, no spaces, e.g., `vinylvote`, `sidequest`)
- `name`: Display name shown to users
- `description`: What your site does

### 1.2 Get Your API Key

```bash
python3 scripts/admin.py show <your-site-id>
```

**Save the API key securely** - you'll need it for backend integration.

### 1.3 Verify Registration

```bash
curl https://nolofication.bynolo.ca/api/sites/public
```

Your site should appear in the list.

## Step 2: Define Notification Categories

Categories allow users to opt into specific types of notifications and configure delivery schedules per category. This provides fine-grained control over what notifications they receive and when.

### 2.1 Plan Your Categories

Think about the different types of notifications your site sends:

**Examples:**
- `reminders` - Daily/weekly task reminders
- `updates` - New content or feature updates
- `social` - Comments, likes, mentions
- `security` - Account security alerts (should be instant)
- `digest` - Weekly summary emails
- `marketing` - Promotional content

### 2.2 Create Categories (Admin Only)

Contact the Nolofication admin or use the admin API:

```bash
curl -X POST https://nolofication.bynolo.ca/api/sites/your-site-id/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "reminders",
    "name": "Daily Reminders",
    "description": "Get reminded about pending tasks and deadlines",
    "defaults": {
      "frequency": "daily",
      "time_of_day": "09:00",
      "weekly_day": null
    }
  }'
```

**Category Parameters:**
- `key`: Unique identifier (lowercase, no spaces, e.g., `reminders`, `updates`)
- `name`: Display name shown to users
- `description`: What this category includes
- `defaults`: Default scheduling settings
  - `frequency`: `instant`, `daily`, or `weekly`
  - `time_of_day`: 24-hour format (e.g., `09:00`, `18:30`)
  - `weekly_day`: 0-6 (Monday=0) for weekly notifications

### 2.3 Common Category Patterns

**Instant Notifications:**
```json
{
  "key": "security",
  "name": "Security Alerts",
  "description": "Important account security notifications",
  "defaults": { "frequency": "instant" }
}
```

**Daily Digest:**
```json
{
  "key": "activity",
  "name": "Daily Activity",
  "description": "Summary of daily activity on your account",
  "defaults": {
    "frequency": "daily",
    "time_of_day": "18:00"
  }
}
```

**Weekly Summary:**
```json
{
  "key": "weekly_recap",
  "name": "Weekly Recap",
  "description": "Your weekly highlights and statistics",
  "defaults": {
    "frequency": "weekly",
    "time_of_day": "09:00",
    "weekly_day": 0
  }
}
```

### 2.4 List Categories

```bash
curl https://nolofication.bynolo.ca/api/sites/your-site-id/categories
```

## Step 3: Backend Integration

### 2.1 Install HTTP Client Library

**Python (Flask/Django):**
```bash
pip install requests
```

**Node.js (Express):**
```bash
npm install axios
```

**PHP (Laravel):**
```bash
composer require guzzlehttp/guzzle
```

### 3.2 Create Notification Service

#### Python Example

```python
# services/nolofication.py
import requests
import os
from typing import List, Optional

class NoloficationService:
    def __init__(self):
        self.base_url = os.getenv('NOLOFICATION_URL', 'https://nolofication.bynolo.ca')
        self.site_id = os.getenv('NOLOFICATION_SITE_ID', 'your-site-id')
        self.api_key = os.getenv('NOLOFICATION_API_KEY')
        
        if not self.api_key:
            raise ValueError("NOLOFICATION_API_KEY environment variable required")
    
    def send_notification(
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
        """
        Send notification to a single user.
        
        Args:
            user_id: KeyN user ID
            title: Notification title
            message: Plain text message (fallback)
            notification_type: 'info', 'success', 'warning', or 'error'
            category: Category key (e.g., 'reminders', 'updates')
            target_url: URL to redirect user to
            html_message: Optional HTML version of message
            metadata: Optional additional data
        
        Returns:
            Response from Nolofication API
        """
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
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to send notification: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_bulk_notification(
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
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to send bulk notification: {e}")
            return {'success': False, 'error': str(e)}

# Usage example
nolofication = NoloficationService()
```

#### Node.js Example

```javascript
// services/nolofication.js
const axios = require('axios');

class NoloficationService {
    constructor() {
        this.baseUrl = process.env.NOLOFICATION_URL || 'https://nolofication.bynolo.ca';
        this.siteId = process.env.NOLOFICATION_SITE_ID || 'your-site-id';
        this.apiKey = process.env.NOLOFICATION_API_KEY;
        
        if (!this.apiKey) {
            throw new Error('NOLOFICATION_API_KEY environment variable required');
        }
    }
    
    async sendNotification({ 
        userId, 
        title, 
        message, 
        type = 'info', 
        category = null,
        targetUrl = null,
        htmlMessage = null, 
        metadata = null 
    }) {
        const url = `${this.baseUrl}/api/sites/${this.siteId}/notify`;
        
        const payload = {
            user_id: userId,
            title,
            message,
            type
        };
        
        if (category) payload.category = category;
        if (targetUrl) payload.target_url = targetUrl;
        if (htmlMessage) payload.html_message = htmlMessage;
        if (metadata) payload.metadata = metadata;
        
        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            return response.data;
        } catch (error) {
            console.error('Failed to send notification:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    async sendBulkNotification({ 
        userIds, 
        title, 
        message, 
        type = 'info', 
        category = null,
        targetUrl = null,
        htmlMessage = null, 
        metadata = null 
    }) {
        const url = `${this.baseUrl}/api/sites/${this.siteId}/notify`;
        
        const payload = {
            user_ids: userIds,
            title,
            message,
            type
        };
        
        if (category) payload.category = category;
        if (targetUrl) payload.target_url = targetUrl;
        if (htmlMessage) payload.html_message = htmlMessage;
        if (metadata) payload.metadata = metadata;
            type
        };
        
        if (category) payload.category = category;
        if (htmlMessage) payload.html_message = htmlMessage;
        if (metadata) payload.metadata = metadata;
        
        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            
            return response.data;
        } catch (error) {
            console.error('Failed to send bulk notification:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new NoloficationService();
```

### 3.3 Add Environment Variables

```bash
# .env
NOLOFICATION_URL=https://nolofication.bynolo.ca
NOLOFICATION_SITE_ID=your-site-id
NOLOFICATION_API_KEY=your-api-key-from-registration
```

### 3.4 Integration Examples with Categories

#### Welcome Email on User Registration

```python
# In your user registration handler
from services.nolofication import nolofication

def register_user(email, username):
    # ... your registration logic ...
    
    # Get KeyN user ID (from your auth system)
    keyn_user_id = user.keyn_id
    
    # Send welcome notification (instant delivery)
    nolofication.send_notification(
        user_id=keyn_user_id,
        title=f"Welcome to {site_name}!",
        message=f"Hi {username}, thanks for joining! Get started by exploring our features.",
        notification_type='success',
        category='updates',  # Maps to your 'updates' category
        target_url=f"https://{site_name}.com/dashboard",
        html_message=f"""
            <h2>Welcome to {site_name}!</h2>
            <p>Hi <strong>{username}</strong>,</p>
            <p>Thanks for joining! Here's what you can do:</p>
            <ul>
                <li>Complete your profile</li>
                <li>Browse our content</li>
                <li>Connect with others</li>
            </ul>
            <p><a href="https://yoursite.com/getting-started">Get Started</a></p>
        """
    )
```

#### Activity Notification (Respects User Schedule)

```python
# When someone likes a post, comments, etc.
def notify_post_interaction(post_owner_id, actor_name, action):
    # User's schedule preferences for 'social' category determine delivery
    nolofication.send_notification(
        user_id=post_owner_id,
        title=f"New {action} on your post",
        message=f"{actor_name} {action} your post",
        target_url=f"https://yoursite.com/posts/{post.id}",
        notification_type='info',
        category='social',  # Will be delivered per user's 'social' schedule
        metadata={
            'post_id': post.id,
            'actor_id': actor.id,
            'action': action
        }
    )
```

#### Daily Reminder

```python
# For task/deadline reminders
def send_task_reminder(user_id, task_title, due_date):
    nolofication.send_notification(
        user_id=user_id,
        title="Task Reminder",
        message=f"Don't forget: {task_title} is due {due_date}",
        target_url=f"https://yoursite.com/tasks/{task.id}",
        notification_type='warning',
        category='reminders',  # Delivered daily at user's preferred time
        metadata={
            'task_id': task.id,
            'due_date': due_date
        }
    )
```

#### Scheduled Digest Notification

```python
# Weekly digest - sent when user configured for weekly delivery
def send_weekly_digest():
    active_users = get_active_users()
    
    for user in active_users:
        digest_html = generate_user_digest(user)
        
        nolofication.send_notification(
            user_id=user.keyn_id,
            title="Your Weekly Digest",
            message="Here's what happened this week",
            notification_type='info',
            category='digest',  # User controls weekly timing
            html_message=digest_html,
            target_url="https://myapp.com/digest/weekly"
        )
```

## Step 4: Frontend Integration

### 4.1 Embedded Preferences Link

Add a link to Nolofication preferences in your user settings:

```html
<!-- In your settings page -->
<div class="notification-settings">
    <h3>Notification Preferences</h3>
    <p>Manage how and when you receive notifications from {site_name}</p>
    <a href="https://nolofication.bynolo.ca/sites/your-site-id/preferences" 
       class="btn btn-primary"
       target="_blank">
        Configure Notifications
    </a>
    <p class="text-sm text-gray-600 mt-2">
        • Choose notification categories<br>
        • Set daily or weekly delivery schedules<br>
        • Control notification channels
    </p>
</div>
```

### 4.2 Embedded Widget (Optional)

For a seamless experience, embed the preferences directly:

```html
<div class="notification-widget">
    <iframe 
        src="https://nolofication.bynolo.ca/embed/sites/your-site-id/preferences"
        width="100%"
        height="800"
        frameborder="0"
        style="border: 1px solid #ccc; border-radius: 8px;">
    </iframe>
</div>
```

### 4.3 Check User Category Preferences (Optional)

If you want to show category status in your UI:

```javascript
// Fetch user's category preferences for your site
async function getUserCategoryPreferences(keynJwt, siteId) {
    const response = await fetch(
        `https://nolofication.bynolo.ca/api/sites/${siteId}/categories`,
        {
            headers: {
                'Authorization': `Bearer ${keynJwt}`
            }
        }
    );
    
    return response.json();
}

// Display category status
const categories = await getUserCategoryPreferences(user.keynToken, 'your-site-id');
categories.categories.forEach(cat => {
    const enabled = cat.user_preference?.enabled !== false;
    const schedule = cat.user_preference?.schedule || cat.category.defaults;
    console.log(`${cat.category.name}: ${enabled ? 'Enabled' : 'Disabled'}, ${schedule.frequency}`);
});
```

## Step 5: Testing

### 5.1 Test Single Notification with Category

```bash
# From your site's backend
curl -X POST https://nolofication.bynolo.ca/api/sites/your-site-id/notify \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-keyn-user-id",
    "title": "Test Notification",
    "message": "This is a test from YourSite",
    "type": "info",
    "category": "reminders"
  }'
```

### 5.2 Test Bulk Notification

```bash
curl -X POST https://nolofication.bynolo.ca/api/sites/your-site-id/notify \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["user1", "user2", "user3"],
    "title": "Bulk Test",
    "message": "Testing bulk notifications",
    "type": "info",
    "category": "updates"
  }'
```

### 5.3 Verify Category Configuration

```bash
# List categories for your site
curl https://nolofication.bynolo.ca/api/sites/your-site-id/categories

# Check user's category preferences (requires user auth)
curl https://nolofication.bynolo.ca/api/sites/your-site-id/categories \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

### 5.4 Verify Delivery

1. Check your email inbox
2. Visit https://nolofication.bynolo.ca/notifications
3. Check notification history in Nolofication dashboard
4. Verify scheduling: instant notifications arrive immediately, scheduled ones wait for user's preferred time

## Scheduling & Digests

### How Scheduling Works

Nolofication supports three delivery modes:

1. **Instant** (default) - Notifications sent immediately
2. **Daily** - Notifications batched and sent once per day at user's preferred time
3. **Weekly** - Notifications batched and sent once per week

### User Control

Users can configure scheduling:
- **Site-level default** - Applies to all categories without specific schedules
- **Per-category** - Override for specific notification types

### Scheduler Architecture

The Nolofication backend runs a scheduler (`scripts/scheduler.py`) that:
- Checks every minute for scheduled delivery times
- Respects user timezones
- Batches notifications per user/category
- Delivers via configured channels

### Best Practices for Sites

**Instant Categories:**
- Security alerts
- Real-time interactions (comments, mentions)
- Urgent notifications

**Daily Categories:**
- Task reminders
- Activity summaries
- Daily digests

**Weekly Categories:**
- Performance reports
- Weekly recaps
- Newsletter-style content

**Example Category Setup:**

```python
# Security alerts - always instant
{
  "key": "security",
  "name": "Security Alerts",
  "defaults": { "frequency": "instant" }
}

# Reminders - daily by default at 9 AM
{
  "key": "reminders",
  "name": "Task Reminders",
  "defaults": {
    "frequency": "daily",
    "time_of_day": "09:00"
  }
}

# Weekly recap - Mondays at 9 AM
{
  "key": "weekly_recap",
  "name": "Weekly Summary",
  "defaults": {
    "frequency": "weekly",
    "time_of_day": "09:00",
    "weekly_day": 0
  }
}
```

### Timezone Handling

- Users set their timezone in preferences
- Scheduler converts all times to user's local timezone
- Default timezone: UTC if not specified
- Use IANA timezone names (e.g., `America/New_York`, `Europe/London`)

## Cancelling Pending Notifications

When a notification is sent with a `category` that has scheduled delivery (daily/weekly), it's queued as a **pending notification** instead of being sent immediately. Sites can query and cancel these pending notifications if the action that triggered them becomes irrelevant.

### Use Case: Daily Voting Reminder

**Scenario:** Your site sends a daily reminder at 9 AM to users who haven't voted yet. If a user votes before 9 AM, you want to cancel their pending reminder.

#### 1. Send the Scheduled Notification

```python
# When the day starts, send reminder to all users who haven't voted
from services.nolofication import nolofication

def send_daily_vote_reminders():
    users_without_votes = get_users_who_havent_voted_today()
    
    for user in users_without_votes:
        result = nolofication.send_notification(
            user_id=user.keyn_id,
            title="Don't forget to vote today!",
            message="Cast your vote before the day ends",
            category='reminders',  # Category configured for daily 9 AM delivery
            metadata={'vote_date': today_date}
        )
        
        # If scheduled, save the pending_id for potential cancellation
        if result.get('status') == 'scheduled':
            # Store pending_id with user's vote record
            save_pending_notification_id(user.id, result['pending_id'])
```

#### 2. List Pending Notifications for a User

```python
# Check what notifications are queued for a specific user
def get_user_pending_notifications(keyn_user_id):
    url = f"{NOLOFICATION_URL}/api/sites/{SITE_ID}/pending-notifications"
    params = {'user_id': keyn_user_id}
    headers = {'X-API-Key': API_KEY}
    
    response = requests.get(url, params=params, headers=headers)
    return response.json()
```

```bash
# Example API call
curl "https://nolofication.bynolo.ca/api/sites/your-site-id/pending-notifications?user_id=123&category=reminders" \
  -H "X-API-Key: your-api-key"
```

**Response:**
```json
{
  "total": 1,
  "limit": 100,
  "offset": 0,
  "pending_notifications": [
    {
      "id": 456,
      "user_id": "123",
      "title": "Don't forget to vote today!",
      "message": "Cast your vote before the day ends",
      "type": "info",
      "category": "reminders",
      "scheduled_for": "2025-12-01T14:00:00",
      "created_at": "2025-12-01T08:30:00",
      "cancelled_at": null,
      "metadata": {"vote_date": "2025-12-01"}
    }
  ]
}
```

#### 3. Cancel Pending Notification

```python
# When user votes, cancel their pending reminder
def handle_user_vote(user_id):
    # Process the vote
    record_vote(user_id)
    
    # Get the pending notification ID
    pending_id = get_pending_notification_id(user_id)
    
    if pending_id:
        # Cancel the notification
        nolofication.cancel_pending_notification(pending_id)

# Add to your NoloficationService class:
def cancel_pending_notification(self, notification_id: int) -> dict:
    """Cancel a pending scheduled notification."""
    url = f"{self.base_url}/api/sites/{self.site_id}/pending-notifications/{notification_id}"
    headers = {'X-API-Key': self.api_key}
    
    try:
        response = requests.delete(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Failed to cancel notification: {e}")
        return {'success': False, 'error': str(e)}
```

```bash
# Example API call
curl -X DELETE "https://nolofication.bynolo.ca/api/sites/your-site-id/pending-notifications/456" \
  -H "X-API-Key: your-api-key"
```

**Response:**
```json
{
  "message": "Pending notification cancelled successfully",
  "notification_id": 456
}
```

### Complete Example: Voting Site

```python
# services/nolofication.py
class NoloficationService:
    # ... (existing methods) ...
    
    def get_pending_notifications(
        self,
        user_id: str = None,
        category: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> dict:
        """Get pending notifications for this site."""
        url = f"{self.base_url}/api/sites/{self.site_id}/pending-notifications"
        params = {}
        if user_id:
            params['user_id'] = user_id
        if category:
            params['category'] = category
        params['limit'] = limit
        params['offset'] = offset
        
        headers = {'X-API-Key': self.api_key}
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to get pending notifications: {e}")
            return {'error': str(e)}
    
    def cancel_pending_notification(self, notification_id: int) -> dict:
        """Cancel a pending notification."""
        url = f"{self.base_url}/api/sites/{self.site_id}/pending-notifications/{notification_id}"
        headers = {'X-API-Key': self.api_key}
        
        try:
            response = requests.delete(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to cancel notification: {e}")
            return {'error': str(e)}

# app/routes/votes.py
from services.nolofication import nolofication
from models import Vote, User

@app.route('/vote', methods=['POST'])
def cast_vote():
    user_id = get_current_user_id()
    choice = request.json['choice']
    
    # Record the vote
    vote = Vote(user_id=user_id, choice=choice, date=today)
    db.session.add(vote)
    
    # Cancel any pending vote reminders for this user
    pending = nolofication.get_pending_notifications(
        user_id=user.keyn_id,
        category='reminders'
    )
    
    for notif in pending.get('pending_notifications', []):
        # Check if it's a vote reminder based on metadata or title
        if 'vote' in notif['title'].lower():
            nolofication.cancel_pending_notification(notif['id'])
            print(f"Cancelled pending vote reminder {notif['id']}")
    
    db.session.commit()
    
    return {'message': 'Vote recorded successfully'}

# Scheduled job (runs daily at 8 AM)
def send_daily_vote_reminders():
    """Send reminders to users who haven't voted today."""
    today = date.today()
    users = User.query.all()
    
    for user in users:
        # Check if user has voted today
        vote = Vote.query.filter_by(user_id=user.id, date=today).first()
        
        if not vote:
            # Send scheduled reminder (will be delivered at user's preferred time)
            result = nolofication.send_notification(
                user_id=user.keyn_id,
                title="Don't forget to vote today!",
                message="Make your voice heard - cast your vote before the day ends",
                category='reminders',  # User's schedule: daily at 9 AM
                metadata={
                    'vote_date': today.isoformat(),
                    'reminder_type': 'daily_vote'
                }
            )
            
            if result.get('status') == 'scheduled':
                print(f"Reminder queued for {user.username}, will send at {result['scheduled_for']}")
```

### API Reference

#### List Pending Notifications

```
GET /api/sites/{site_id}/pending-notifications
```

**Headers:**
- `X-API-Key`: Your site's API key

**Query Parameters:**
- `user_id` (optional): Filter by KeyN user ID
- `category` (optional): Filter by category key
- `limit` (optional): Max results (default 100, max 1000)
- `offset` (optional): Pagination offset (default 0)

**Response:**
```json
{
  "total": 5,
  "limit": 100,
  "offset": 0,
  "pending_notifications": [...]
}
```

#### Cancel Pending Notification

```
DELETE /api/sites/{site_id}/pending-notifications/{notification_id}
```

**Headers:**
- `X-API-Key`: Your site's API key

**Response:**
```json
{
  "message": "Pending notification cancelled successfully",
  "notification_id": 456
}
```

### Best Practices

1. **Store pending IDs**: When sending scheduled notifications, save the `pending_id` returned in the response for later cancellation
2. **Query by category**: Use category filtering to find specific types of pending notifications efficiently
3. **Metadata for identification**: Include metadata in notifications to identify which ones to cancel (e.g., `reminder_type`, `vote_date`)
4. **Cancel on action completion**: Immediately cancel pending notifications when users complete the relevant action
5. **Batch queries**: List all pending notifications for a user at once rather than querying individually

## Step 6: Advanced Features

### Rate Limiting

Nolofication enforces rate limits:
- **100 requests/hour** per site for notify endpoint
- Monitor `X-RateLimit-*` headers in responses

```python
response = requests.post(url, json=payload, headers=headers)
remaining = response.headers.get('X-RateLimit-Remaining')
reset_time = response.headers.get('X-RateLimit-Reset')
```

### Error Handling

```python
def send_with_retry(user_id, title, message):
    max_retries = 3
    for attempt in range(max_retries):
        result = nolofication.send_notification(user_id, title, message)
        
        if result.get('success'):
            return result
        
        if attempt < max_retries - 1:
            time.sleep(2 ** attempt)  # Exponential backoff
    
    # Log failure for manual review
    logger.error(f"Failed to send notification after {max_retries} attempts")
    return None
```

### Background Jobs

Use task queues for non-blocking notifications:

**Celery (Python):**
```python
from celery import shared_task

@shared_task
def send_notification_async(user_id, title, message):
    nolofication.send_notification(user_id, title, message)

# Usage
send_notification_async.delay(user_id, title, message)
```

**Bull (Node.js):**
```javascript
const Queue = require('bull');
const notificationQueue = new Queue('notifications');

notificationQueue.process(async (job) => {
    const { userId, title, message } = job.data;
    await nolofication.sendNotification({ userId, title, message });
});

// Usage
notificationQueue.add({ userId, title, message });
```

### Metadata & Deep Links

Include metadata to create deep links:

```python
nolofication.send_notification(
    user_id=user_id,
    title="New Message",
    message="You have a new message from Alice",
    metadata={
        'action_url': 'https://yoursite.com/messages/123',
        'conversation_id': '123',
        'sender_id': 'alice'
    }
)
```

## HTML Email Support

### Overview

Nolofication supports HTML email notifications for rich, branded emails. Always provide both plain text (`message`) and HTML (`html_message`) versions.

### Implementation

#### Basic HTML Email

```python
nolofication.send_notification(
    user_id=user_id,
    title="Welcome to VinylVote!",
    message="Thanks for joining! Start voting on your favorite tracks.",  # Fallback
    html_message="""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00c853;">Welcome to VinylVote!</h2>
            <p>Thanks for joining!</p>
            <p>Start voting on your favorite tracks and discover new music.</p>
            <a href="https://vinylvote.com/explore" 
               style="display: inline-block; padding: 10px 20px; background: #00c853; 
                      color: white; text-decoration: none; border-radius: 5px;">
                Explore Now
            </a>
        </div>
    """
)
```

#### Using Email Templates

Create reusable HTML templates:

```python
# templates/email/welcome.html
def get_welcome_email_html(username, site_url):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center" style="padding: 20px;">
                    <table width="600" cellpadding="0" cellspacing="0" 
                           style="background-color: white; border-radius: 8px;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center;">
                                <h1 style="color: #00c853; margin: 0;">Welcome to Our Site!</h1>
                            </td>
                        </tr>
                        
                        <!-- Body -->
                        <tr>
                            <td style="padding: 20px 40px;">
                                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                    Hi <strong>{username}</strong>,
                                </p>
                                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                    Thanks for joining! We're excited to have you here.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- CTA Button -->
                        <tr>
                            <td style="padding: 20px 40px; text-align: center;">
                                <a href="{site_url}/getting-started" 
                                   style="display: inline-block; padding: 15px 30px; 
                                          background-color: #00c853; color: white; 
                                          text-decoration: none; border-radius: 5px; 
                                          font-weight: bold;">
                                    Get Started
                                </a>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px; text-align: center; 
                                       border-top: 1px solid #eee;">
                                <p style="font-size: 12px; color: #999;">
                                    You're receiving this because you signed up for our service.<br>
                                    <a href="{site_url}/preferences" 
                                       style="color: #00c853;">Manage notification preferences</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

# Usage
html = get_welcome_email_html(username="Alice", site_url="https://yoursite.com")
nolofication.send_notification(
    user_id=user_id,
    title="Welcome!",
    message="Thanks for joining!",
    html_message=html
)
```

#### HTML Email Best Practices

1. **Always provide plain text fallback** - Required for accessibility and email clients that don't support HTML
2. **Use inline CSS** - Email clients strip `<style>` tags
3. **Use tables for layout** - Flexbox/Grid not widely supported
4. **Test across email clients** - Gmail, Outlook, Apple Mail render differently
5. **Keep it simple** - Avoid complex layouts
6. **Include alt text** - For images
7. **Maximum width 600px** - For optimal mobile rendering

#### Rich Notification Examples

**Order Confirmation:**
```python
html = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px;">
    <h2 style="color: #00c853;">Order Confirmed!</h2>
    <p>Thanks for your order #{order_id}</p>
    <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f9f9f9;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: right;">Price</th>
        </tr>
        {generate_order_items_html(order)}
    </table>
    <p><strong>Total: ${total}</strong></p>
    <a href="https://yoursite.com/orders/{order_id}" 
       style="display: inline-block; padding: 12px 24px; background: #00c853; 
              color: white; text-decoration: none; border-radius: 4px;">
        View Order
    </a>
</div>
"""
```

**Weekly Digest:**
```python
html = f"""
<div style="max-width: 600px; font-family: Arial, sans-serif;">
    <h2 style="color: #2ee9ff;">Your Weekly Digest</h2>
    <p>Here's what happened this week:</p>
    
    <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <h3 style="margin-top: 0;">📊 Stats</h3>
        <ul>
            <li>{stats.views} new views</li>
            <li>{stats.likes} new likes</li>
            <li>{stats.comments} new comments</li>
        </ul>
    </div>
    
    <div style="margin: 20px 0;">
        <h3>🔥 Trending This Week</h3>
        {generate_trending_items_html(trending)}
    </div>
    
    <a href="https://yoursite.com/dashboard">View Full Dashboard</a>
</div>
"""
```

## Troubleshooting

**Notifications not sending:**
- Verify API key is correct
- Check rate limits in response headers
- Ensure user has KeyN ID
- Check Nolofication logs on server

**Users not receiving notifications:**
- Verify user has set notification preferences
- Check user's email address is valid
- Ensure site is approved in Nolofication

**HTML emails not rendering:**
- Validate HTML using email testing tool
- Ensure inline CSS is used
- Provide plain text fallback

## Support

- Documentation: `https://nolofication.bynolo.ca/docs`
- API Reference: `/backend/API.md`
- Issues: Contact Nolofication admin

## Checklist

- [ ] Site registered in Nolofication
- [ ] API key obtained and stored securely
- [ ] Notification service implemented in backend
- [ ] Environment variables configured
- [ ] Test notifications sent successfully
- [ ] Preferences link added to user settings
- [ ] HTML email templates created
- [ ] Error handling implemented
- [ ] Rate limiting monitored
- [ ] Production deployment tested
