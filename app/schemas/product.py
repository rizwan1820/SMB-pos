from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ProductCreate(BaseModel):
    category_id: UUID
    name: str
    sku: str
    barcode: str
    cost_price: Decimal
    selling_price: Decimal
    tax_rate: Decimal
    low_stock_threshold: int = 0


class ProductUpdate(BaseModel):
    category_id: Optional[UUID] = None
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    status: Optional[str] = None
    low_stock_threshold: Optional[int] = None
