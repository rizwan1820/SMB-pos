from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.services import customer_service


router = APIRouter()


@router.post("/customers")
def create_customer(
    customer: CustomerCreate,
    current_user=Depends(get_current_user)
):
    return customer_service.create_customer(
        customer,
        current_user
    )


@router.get("/customers")
def get_customers(
    search: str | None = Query(default=None),
    current_user=Depends(get_current_user)
):
    return customer_service.get_customers_for_business(
        current_user.business_id,
        search=search
    )


@router.get("/customers/{customer_id}")
def get_customer(
    customer_id: UUID,
    current_user=Depends(get_current_user)
):
    return customer_service.get_customer(
        customer_id,
        current_user.business_id
    )


@router.get("/customers/{customer_id}/profile")
def get_customer_profile(
    customer_id: UUID,
    current_user=Depends(get_current_user)
):
    return customer_service.get_customer_profile(
        customer_id,
        current_user
    )


@router.patch("/customers/{customer_id}")
def update_customer(
    customer_id: UUID,
    customer: CustomerUpdate,
    current_user=Depends(get_current_user)
):
    return customer_service.update_customer(
        customer_id,
        customer,
        current_user.business_id
    )


@router.patch("/customers/{customer_id}/archive")
def archive_customer(
    customer_id: UUID,
    current_user=Depends(get_current_user)
):
    return customer_service.archive_customer(
        customer_id,
        current_user.business_id
    )
