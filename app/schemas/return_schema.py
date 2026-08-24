from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class RefundMethod(str, Enum):
    cash = "cash"
    card = "card"
    other = "other"


class ReturnItemRequest(BaseModel):
    order_item_id: UUID
    quantity: Decimal = Field(gt=0)


class ReturnRequest(BaseModel):
    order_id: UUID
    reason: str = Field(min_length=1)
    restock: bool
    items: list[ReturnItemRequest] = Field(min_length=1)
    refund_method: RefundMethod
    refund_reference: str | None = None
