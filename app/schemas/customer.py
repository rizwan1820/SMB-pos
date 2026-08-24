from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


CustomerType = Literal["individual", "business"]


class CustomerBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    @field_validator("name", "phone", "email", "address", "notes", mode="before", check_fields=False)
    @classmethod
    def trim_optional_text(cls, value):
        if value is None:
            return None

        if isinstance(value, str):
            value = value.strip()
            return value or None

        return value


class CustomerCreate(CustomerBase):
    name: str = Field(min_length=1)
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    customer_type: CustomerType = "individual"
    notes: str | None = Field(default=None, max_length=2000)


class CustomerUpdate(CustomerBase):
    name: str | None = Field(default=None, min_length=1)
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    customer_type: CustomerType | None = None
    notes: str | None = Field(default=None, max_length=2000)
    status: str | None = None
