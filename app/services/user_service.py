from app.auth.supabase_auth import supabase
from app.database.connection import SessionLocal
from app.models.profile import Profile
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

def create_user(user):
    try:
        auth_response = supabase.auth.admin.create_user({
            "email": user.email,
            "password": user.password,
            "email_confirm": True
        })
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not create authentication user"
        )

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

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid business or role data"
        )

    finally:
        db.close()


def login_user(user):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })

        return response.session

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
