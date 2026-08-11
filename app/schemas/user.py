from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    business_id: UUID
    role_id: UUID

class UserLogin(BaseModel):
    email: EmailStr
    password: str