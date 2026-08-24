from fastapi import APIRouter, Depends

from uuid import UUID

from app.auth.dependencies import get_current_user, require_platform_admin
from app.schemas.business import (
    BusinessCreate,
    BusinessSettingsResponse,
    BusinessSettingsUpdate,
    BusinessStatusUpdate,
)
from app.services import business_service

router = APIRouter()

@router.get("/businesses")
def get_businesses(current_user=Depends(require_platform_admin)):
    return business_service.get_businesses()


@router.post("/businesses")
def create_business(
    business: BusinessCreate,
    current_user=Depends(require_platform_admin),
):
    return business_service.create_business(business)


@router.get("/businesses/{business_id}")
def get_business(
    business_id: UUID,
    current_user=Depends(require_platform_admin),
):
    return business_service.get_business(business_id)


@router.patch("/businesses/{business_id}/status")
def update_business_status(
    business_id: UUID,
    status_update: BusinessStatusUpdate,
    current_user=Depends(require_platform_admin),
):
    return business_service.update_business_status(
        business_id,
        status_update,
    )


@router.get("/businesses/{business_id}/users")
def get_business_users(
    business_id: UUID,
    current_user=Depends(require_platform_admin),
):
    return business_service.get_business_users(business_id)


@router.get(
    "/business/settings",
    response_model=BusinessSettingsResponse,
)
def get_business_settings(current_user=Depends(get_current_user)):
    return business_service.get_business_settings(current_user)


@router.patch(
    "/business/settings",
    response_model=BusinessSettingsResponse,
)
def update_business_settings(
    settings: BusinessSettingsUpdate,
    current_user=Depends(get_current_user),
):
    return business_service.update_business_settings(
        settings,
        current_user,
    )
