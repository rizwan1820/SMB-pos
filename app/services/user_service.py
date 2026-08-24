from app.auth.supabase_auth import supabase
from app.database.connection import SessionLocal
from app.models.business import Business
from app.models.profile import Profile
from app.models.role import Role
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

def user_response(profile, role_name=None):
    return {
        "id": profile.id,
        "name": profile.name,
        "email": None,
        "business_id": profile.business_id,
        "role_id": profile.role_id,
        "role": role_name,
        "status": profile.status,
        "is_platform_admin": profile.is_platform_admin,
        "created_at": profile.created_at,
    }


def current_user_response(profile):
    return user_response(profile)


def create_user(user, current_user):
    db = SessionLocal()

    try:
        business_id = (
            user.business_id
            if current_user.is_platform_admin
            else current_user.business_id
        )

        if business_id is None:
            raise HTTPException(
                status_code=400,
                detail="business_id is required for platform admin user creation"
            )

        business = db.get(Business, business_id)

        if not business:
            raise HTTPException(
                status_code=404,
                detail="Business not found"
            )

        role = (
            db.query(Role)
            .filter(
                Role.id == user.role_id,
                Role.business_id == business_id,
            )
            .first()
        )

        if not role:
            raise HTTPException(
                status_code=404,
                detail="Role not found"
            )

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

        profile = Profile(
            id=auth_user.id,
            name=user.name,
            business_id=business_id,
            role_id=user.role_id
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return user_response(profile, role.name)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid business or role data"
        )

    finally:
        db.close()


def get_users(current_user):
    db = SessionLocal()

    try:
        users = (
            db.query(Profile, Role.name.label("role_name"))
            .join(Role, Role.id == Profile.role_id)
            .filter(
                Profile.business_id == current_user.business_id,
                Role.business_id == current_user.business_id,
            )
            .order_by(Profile.created_at.desc())
            .all()
        )

        return [
            user_response(profile, role_name)
            for profile, role_name in users
        ]

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
