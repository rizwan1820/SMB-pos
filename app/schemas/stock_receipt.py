from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StockReceiptItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: UUID
    quantity: Decimal = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)


class StockReceiptCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supplier_id: UUID
    receipt_date: date
    reference: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)
    items: list[StockReceiptItemCreate] = Field(min_length=1)

    @field_validator("reference", "notes")
    @classmethod
    def trim_optional_text(cls, value: str | None):
        if value is None:
            return None

        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def reject_duplicate_products(self):
        product_ids = [item.product_id for item in self.items]

        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate product lines are not allowed")

        return self


class StockReceiptListItem(BaseModel):
    id: UUID
    supplier_id: UUID
    supplier_name: str
    receipt_date: date
    reference: str | None
    total_cost: Decimal
    status: str
    created_at: datetime


class StockReceiptDetailSupplier(BaseModel):
    id: UUID
    name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None


class StockReceiptDetailItem(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_sku: str
    quantity: Decimal
    unit_cost: Decimal
    line_total: Decimal


class StockReceiptDetail(BaseModel):
    id: UUID
    supplier: StockReceiptDetailSupplier
    receipt_date: date
    reference: str | None
    notes: str | None
    total_cost: Decimal
    status: str
    created_by: UUID
    created_by_name: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[StockReceiptDetailItem]
