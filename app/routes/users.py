from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schemas.user import UserCreate
from app.schemas.user import UserLogin
from app.services import user_service

router = APIRouter()


@router.post("/users")
def create_user(user: UserCreate):
    return user_service.create_user(user)

@router.post("/login")
def login(user: UserLogin):
    return user_service.login_user(user)

@router.get("/me")
def get_me(current_user = Depends(get_current_user)):
    return current_user
