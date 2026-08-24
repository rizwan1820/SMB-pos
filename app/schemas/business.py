import re
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class BusinessCreate(BaseModel):
    name: str = Field(min_length=1)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Business name is required")

        return value


class BusinessSettingsResponse(BaseModel):
    id: str
    name: str
    logo_url: str | None
    address: str | None
    phone: str | None
    email: str | None
    currency: str
    default_tax_rate: Decimal
    tax_label: str
    invoice_prefix: str
    invoice_business_name: str | None
    invoice_business_details: str | None


class BusinessSettingsUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    logo_url: str | None = Field(default=None, max_length=500)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    default_tax_rate: Decimal | None = Field(default=None, ge=0, le=100)
    tax_label: str | None = Field(default=None, min_length=1, max_length=50)
    invoice_prefix: str | None = Field(default=None, min_length=1, max_length=20)
    invoice_business_name: str | None = Field(default=None, max_length=255)
    invoice_business_details: str | None = None

    @field_validator(
        "logo_url",
        "address",
        "phone",
        "invoice_business_name",
        "invoice_business_details",
        mode="before",
    )
    @classmethod
    def trim_optional_string(cls, value):
        if value is None:
            return None

        if isinstance(value, str):
            value = value.strip()
            return value or None

        return value

    @field_validator("name", "tax_label", mode="before")
    @classmethod
    def trim_required_string(cls, value):
        if value is None:
            return None

        if isinstance(value, str):
            value = value.strip()

            if not value:
                raise ValueError("Value cannot be blank")

            return value

        return value

    @field_validator("currency", mode="before")
    @classmethod
    def validate_currency(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip().upper()

        if not re.fullmatch(r"[A-Z]{3}", value):
            raise ValueError("Currency must be a 3-letter uppercase code")

        return value

    @field_validator("invoice_prefix", mode="before")
    @classmethod
    def validate_invoice_prefix(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip().upper().rstrip("-")

        if not value:
            raise ValueError("Invoice prefix is required")

        if len(value) > 20:
            raise ValueError("Invoice prefix is too long")

        if not re.fullmatch(r"[A-Z0-9]+", value):
            raise ValueError(
                "Invoice prefix may contain only letters and numbers"
            )

        return value


class BusinessStatusUpdate(BaseModel):
    status: Literal["active", "inactive", "archived"]
