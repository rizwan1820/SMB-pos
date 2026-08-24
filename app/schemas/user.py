from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    business_id: UUID | None = None
    role_id: UUID

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str):
        value = value.strip()

        if not value:
            raise ValueError("Name is required")

        return value

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
