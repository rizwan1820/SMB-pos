from app.auth.supabase_auth import supabase
from app.database.connection import SessionLocal
from app.models.profile import Profile
from fastapi import HTTPException

def create_user(user):
    auth_response = supabase.auth.admin.create_user({
        "email": user.email,
        "password": user.password,
        "email_confirm": True
    })

    auth_user = auth_response.user

    db = SessionLocal()

    try:
        profile = Profile(
            id=auth_user.id,
            name=user.name,
            business_id=user.business_id,
            role_id=user.role_id
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return profile

    finally:
        db.close()

from fastapi import HTTPException


def login_user(user):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })

        return {
            "access_token": response.session.access_token,
            "token_type": "bearer"
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )