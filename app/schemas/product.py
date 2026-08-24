from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    category_id: UUID
    name: str = Field(min_length=1)
    sku: str = Field(min_length=1)
    barcode: str = Field(min_length=1)
    cost_price: Decimal = Field(ge=0)
    selling_price: Decimal = Field(ge=0)
    tax_rate: Decimal = Field(ge=0)
    low_stock_threshold: int = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    category_id: Optional[UUID] = None
    name: Optional[str] = Field(default=None, min_length=1)
    sku: Optional[str] = Field(default=None, min_length=1)
    barcode: Optional[str] = Field(default=None, min_length=1)
    cost_price: Optional[Decimal] = Field(default=None, ge=0)
    selling_price: Optional[Decimal] = Field(default=None, ge=0)
    tax_rate: Optional[Decimal] = Field(default=None, ge=0)
    status: Optional[str] = None
    low_stock_threshold: Optional[int] = Field(default=None, ge=0)
