from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class OpeningStockCreate(BaseModel):
    product_id: UUID
    quantity: Decimal
    reference: str | None = None
    notes: str | None = None


class StockReceiveCreate(BaseModel):
    product_id: UUID
    quantity: Decimal
    reference: str | None = None
    notes: str | None = None


class StockAdjustmentCreate(BaseModel):
    product_id: UUID
    quantity: Decimal
    reference: str | None = None
    notes: str | None = None
