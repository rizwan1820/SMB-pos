from fastapi import APIRouter

from app.schemas.user import UserCreate
from app.services import user_service
from app.schemas.user import UserLogin
from fastapi import Depends
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_permission

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

@router.get("/test-order-permission")
def test_order_permission(
    current_user=Depends(require_permission("order.create"))
):
    return {
        "message": "You can create orders"
    }

@router.get("/test-archive-permission")
def test_archive_permission(
    current_user=Depends(require_permission("product.archive"))
):
    return {
        "message": "You can archive products"
    }