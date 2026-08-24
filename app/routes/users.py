
from app.auth.dependencies import get_current_user
from app.schemas.user import UserCreate
from app.schemas.user import UserLogin
from app.services import user_service
from fastapi import APIRouter, Depends, Response

router = APIRouter()


@router.post("/users")
def create_user(
    user: UserCreate,
    current_user=Depends(get_current_user),
):
    return user_service.create_user(user, current_user)


@router.get("/users")
def get_users(current_user=Depends(get_current_user)):
    return user_service.get_users(current_user)

@router.post("/login")
def login(user: UserLogin, response: Response):
    session = user_service.login_user(user)

    response.set_cookie(
        key="access_token",
        value=session.access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=session.expires_in,
    )

    response.set_cookie(
        key="refresh_token",
        value=session.refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )

    return {
        "message": "Login successful"
    }

@router.get("/me")
def get_me(current_user = Depends(get_current_user)):
    return user_service.current_user_response(current_user)

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
    )

    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="lax",
    )

    return {"message": "Logged out successfully"}
