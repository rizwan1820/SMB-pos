from fastapi import Cookie, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.supabase_auth import supabase
from app.database.connection import SessionLocal
from app.models.profile import Profile


security = HTTPBearer(auto_error=False)


def get_current_user(
    access_token: str | None = Cookie(default=None),
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    token = credentials.credentials if credentials else access_token

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token"
        )

    try:
        response = supabase.auth.get_user(token)

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication"
        )

    if not response.user:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication"
        )

    user_id = response.user.id

    db = SessionLocal()

    try:
        profile = db.get(Profile, user_id)

        if not profile:
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )

        return profile

    finally:
        db.close()
