from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.services import supplier_service


router = APIRouter()


@router.get("/suppliers")
def get_suppliers(current_user=Depends(get_current_user)):
    return supplier_service.get_suppliers_for_business(
        current_user.business_id
    )


@router.post("/suppliers")
def create_supplier(
    supplier: SupplierCreate,
    current_user=Depends(get_current_user)
):
    return supplier_service.create_supplier(
        supplier,
        current_user.business_id
    )


@router.patch("/suppliers/{supplier_id}")
def update_supplier(
    supplier_id: UUID,
    supplier: SupplierUpdate,
    current_user=Depends(get_current_user)
):
    return supplier_service.update_supplier(
        supplier_id,
        supplier,
        current_user.business_id
    )


@router.patch("/suppliers/{supplier_id}/archive")
def archive_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user)
):
    return supplier_service.archive_supplier(
        supplier_id,
        current_user.business_id
    )
