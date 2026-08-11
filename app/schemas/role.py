from pydantic import BaseModel
from uuid import UUID


class RoleCreate(BaseModel):
    name: str
    business_id: UUID