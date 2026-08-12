from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.models.profile import Profile
from app.schemas.role import RoleCreate
from app.services import role_service

router = APIRouter()


@router.post("/roles")
def create_role(role: RoleCreate):
    return role_service.create_role(role)


@router.get("/my-roles")
def get_my_roles(current_user: Profile = Depends(get_current_user)):
    business_id = current_user.business_id
    return role_service.get_roles_for_business(business_id)
