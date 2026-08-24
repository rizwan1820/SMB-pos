from pydantic import BaseModel, Field
from uuid import UUID


class RoleCreate(BaseModel):
    name: str = Field(min_length=1)
    business_id: UUID
