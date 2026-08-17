from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schemas.category import CategoryCreate
from app.services import category_service


router = APIRouter()


@router.post("/categories")
def create_category(
    category: CategoryCreate,
    current_user=Depends(get_current_user)
):
    return category_service.create_category(
        category,
        current_user.business_id
    )

@router.get("/categories")
def get_categories(current_user=Depends(get_current_user)):
    return category_service.get_categories_for_business(
        current_user.business_id
    )