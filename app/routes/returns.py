from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schemas.return_schema import ReturnRequest
from app.services import return_service


router = APIRouter()


@router.post("/returns")
def create_return(
    return_data: ReturnRequest,
    current_user=Depends(get_current_user),
):
    return return_service.create_return(
        return_data,
        current_user,
    )


@router.get("/returns")
def get_returns(current_user=Depends(get_current_user)):
    return return_service.get_returns(current_user)


@router.get("/returns/{return_id}")
def get_return(
    return_id: UUID,
    current_user=Depends(get_current_user),
):
    return return_service.get_return(
        return_id,
        current_user,
    )
