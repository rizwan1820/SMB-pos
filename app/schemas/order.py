from enum import Enum
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentMethod(str, Enum):
    cash = "cash"
    card = "card"
    other = "other"


class CheckoutItem(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(gt=0)


class CheckoutRequest(BaseModel):
    customer_id: UUID | None = None

    items: list[CheckoutItem] = Field(
        min_length=1
    )

    discount_amount: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
    )

    payment_method: PaymentMethod
    payment_reference: str | None = None