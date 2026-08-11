from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.supabase_auth import supabase
from app.database.connection import SessionLocal
from app.models.profile import Profile


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        response = supabase.auth.get_user(token)

        if not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        user_id = response.user.id

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

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