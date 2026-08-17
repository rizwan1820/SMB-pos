from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.schemas.product import ProductCreate, ProductUpdate
from app.services import product_service


router = APIRouter()


@router.get("/products")
def get_products(
    search: Optional[str] = Query(default=None),
    category_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user)
):
    return product_service.get_products_for_business(
        current_user.business_id,
        search=search,
        category_id=category_id,
        status=status
    )


@router.post("/products")
def create_product(
    product: ProductCreate,
    current_user=Depends(get_current_user)
):
    return product_service.create_product(
        product,
        current_user.business_id
    )


@router.patch("/products/{product_id}")
def update_product(
    product_id: UUID,
    product: ProductUpdate,
    current_user=Depends(get_current_user)
):
    return product_service.update_product(
        product_id,
        product,
        current_user.business_id
    )


@router.patch("/products/{product_id}/archive")
def archive_product(
    product_id: UUID,
    current_user=Depends(get_current_user)
):
    return product_service.archive_product(
        product_id,
        current_user.business_id
    )


@router.post("/products/{product_id}/suppliers/{supplier_id}")
def assign_supplier_to_product(
    product_id: UUID,
    supplier_id: UUID,
    current_user=Depends(get_current_user)
):
    return product_service.assign_supplier_to_product(
        product_id,
        supplier_id,
        current_user.business_id
    )


@router.get("/products/{product_id}/suppliers")
def get_product_suppliers(
    product_id: UUID,
    current_user=Depends(get_current_user)
):
    return product_service.get_suppliers_for_product(
        product_id,
        current_user.business_id
    )
