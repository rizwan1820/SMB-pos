from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class OpeningStockCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(gt=0)
    reference: str | None = None
    notes: str | None = None


class StockReceiveCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(gt=0)
    reference: str | None = None
    notes: str | None = None


class StockAdjustmentCreate(BaseModel):
    product_id: UUID
    adjustment_type: Literal[
        "adjustment_in",
        "adjustment_out",
        "damaged",
        "lost",
    ]
    quantity: Decimal = Field(gt=0)
    reference: str | None = None
    notes: str | None = None

    @field_validator("reference", "notes")
    @classmethod
    def trim_optional_text(cls, value: str | None):
        if value is None:
            return None

        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def require_reason_for_loss_events(self):
        if self.adjustment_type in {"damaged", "lost"} and not self.notes:
            raise ValueError("Notes are required for damaged or lost stock")

        return self
