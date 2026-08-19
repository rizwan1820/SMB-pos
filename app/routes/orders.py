from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schemas.order import CheckoutRequest
from app.services import order_service


router = APIRouter()


@router.post("/checkout")
def checkout(
    checkout_data: CheckoutRequest,
    current_user=Depends(get_current_user),
):
    return order_service.checkout(
        checkout_data,
        current_user,
    )


@router.get("/orders")
def get_orders(current_user=Depends(get_current_user)):
    return order_service.get_orders(current_user)


@router.get("/orders/{order_id}")
def get_order(
    order_id: UUID,
    current_user=Depends(get_current_user),
):
    return order_service.get_order(
        order_id,
        current_user,
    )
