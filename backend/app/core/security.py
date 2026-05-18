from datetime import datetime, timedelta, timezone
from typing import Any, Union

import jwt

from app.core.config import settings

ALGORITHM = "HS256"

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_signed_oauth_state(invite_code: str | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload: dict[str, Any] = {
        "exp": expire,
        "purpose": "oauth_state",
        "nonce": create_access_token(subject="oauth-state", expires_delta=timedelta(seconds=30)),
    }
    if invite_code:
        payload["invite_code"] = invite_code
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_signed_oauth_state(state: str) -> dict[str, Any]:
    payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("purpose") != "oauth_state":
        raise jwt.InvalidTokenError("Invalid OAuth state purpose")
    return payload
