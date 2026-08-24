from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SupplierBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    @field_validator(
        "name",
        "contact_person",
        "phone",
        "email",
        "address",
        "notes",
        mode="before",
        check_fields=False,
    )
    @classmethod
    def trim_text(cls, value):
        if value is None:
            return None

        if isinstance(value, str):
            value = value.strip()
            return value or None

        return value


class SupplierCreate(SupplierBase):
    name: str = Field(min_length=1)
    contact_person: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    email: str = Field(min_length=1)
    address: str = Field(min_length=1)
    notes: str | None = Field(default=None, max_length=2000)


class SupplierUpdate(SupplierBase):
    name: Optional[str] = Field(default=None, min_length=1)
    contact_person: Optional[str] = Field(default=None, min_length=1)
    phone: Optional[str] = Field(default=None, min_length=1)
    email: Optional[str] = Field(default=None, min_length=1)
    address: Optional[str] = Field(default=None, min_length=1)
    notes: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[str] = None
