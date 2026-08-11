from fastapi import APIRouter
from app.schemas.business import BusinessCreate
from app.services import business_service

router = APIRouter()

@router.post("/businesses")
def create_business(business: BusinessCreate):
    return business_service.create_business(business)