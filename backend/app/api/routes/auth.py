import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from urllib.parse import urlencode

from app.core.config import settings
from app.core import security
from app.api import deps
from app.models.user import User
from app.schemas.token import Token
from app.services.referrals import attribute_referral, ensure_user_invite_code, resolve_inviter_by_code

router = APIRouter()

class CallbackRequest(BaseModel):
    code: str
    state: str | None = None

@router.get("/login-url")
def get_login_url(invite: str | None = Query(default=None)):
    """Get the KeyN OAuth authorization URL"""
    params = {
        "client_id": settings.KEYN_CLIENT_ID,
        "redirect_uri": settings.KEYN_REDIRECT_URI,
        "scope": "id,username,email,display_name",
        "state": security.create_signed_oauth_state(invite_code=invite),
    }
    url = f"{settings.KEYN_BASE_URL}/oauth/authorize?{urlencode(params)}"
    return {"url": url}

@router.post("/callback", response_model=Token)
async def auth_callback(request: CallbackRequest, db: Session = Depends(deps.get_db)):
    """Handle the OAuth callback and exchange code for local JWT"""
    invite_code: str | None = None
    if request.state:
        try:
            state_payload = security.decode_signed_oauth_state(request.state)
        except jwt.PyJWTError:
            raise HTTPException(status_code=400, detail="Invalid authentication state")
        invite_code = state_payload.get("invite_code")

    # 1. Exchange code for KeyN access token
    token_data = {
        "grant_type": "authorization_code",
        "code": request.code,
        "client_id": settings.KEYN_CLIENT_ID,
        "client_secret": settings.KEYN_CLIENT_SECRET,
        "redirect_uri": settings.KEYN_REDIRECT_URI,
    }
    
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(f"{settings.KEYN_BASE_URL}/oauth/token", data=token_data)
            token_response.raise_for_status()
            keyn_token = token_response.json().get("access_token")
        except httpx.HTTPError:
            raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
            
        if not keyn_token:
            raise HTTPException(status_code=400, detail="Invalid token response")
            
        # 2. Get user data from KeyN
        try:
            user_response = await client.get(
                f"{settings.KEYN_BASE_URL}/api/user-scoped",
                headers={"Authorization": f"Bearer {keyn_token}"}
            )
            user_response.raise_for_status()
            user_data = user_response.json()
        except httpx.HTTPError:
            raise HTTPException(status_code=400, detail="Failed to fetch user data")
            
    keyn_id = str(user_data.get("id"))
    username = user_data.get("username")
    email = user_data.get("email")
    display_name = user_data.get("display_name")
    
    if not keyn_id or not username:
        raise HTTPException(status_code=400, detail="Incomplete user data received")
        
    # 3. Create or update user in our database
    user = db.query(User).filter(User.keyn_id == keyn_id).first()
    if not user:
        user = User(
            keyn_id=keyn_id, 
            username=username, 
            email=email,
            display_name=display_name,
            invite_code="",
        )
        ensure_user_invite_code(db, user)
        db.add(user)
        db.flush()
        inviter = resolve_inviter_by_code(db, invite_code)
        attribute_referral(user, inviter)
        db.commit()
        db.refresh(user)
    else:
        ensure_user_invite_code(db, user)
        # Update username/email/display_name if changed
        if (
            user.username != username
            or user.email != email
            or user.display_name != display_name
        ):
            user.username = username
            user.email = email
            user.display_name = display_name
            db.commit()
        elif not user.invite_code:
            db.commit()
            
    # 4. Issue local JWT
    access_token = security.create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_current_user_info(current_user: User = Depends(deps.get_current_user)):
    """Get current user info"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "invite_code": current_user.invite_code,
        "referred_by_user_id": current_user.referred_by_user_id,
        "use_display_name": current_user.use_display_name if current_user.use_display_name is not None else True,
        "show_on_leaderboard": current_user.show_on_leaderboard if current_user.show_on_leaderboard is not None else True,
        "public_profile": current_user.public_profile if current_user.public_profile is not None else False,
        "is_active": current_user.is_active,
        "is_admin": current_user.is_admin
    }

@router.get("/notification-preferences-url")
def get_notification_preferences_url(current_user: User = Depends(deps.get_current_user)):
    """Get the Nolofication preferences URL for the configured site."""
    return {
        "url": f"{settings.NOLOFICATION_URL.rstrip('/')}/sites/{settings.NOLOFICATION_SITE_ID}/preferences"
    }
