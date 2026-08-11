from fastapi import APIRouter

from app.schemas.role import RoleCreate
from app.services import role_service

router = APIRouter()


@router.post("/roles")
def create_role(role: RoleCreate):
    return role_service.create_role(role)
