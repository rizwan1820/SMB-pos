from typing import Optional

from pydantic import BaseModel


class SupplierCreate(BaseModel):
    name: str
    contact_person: str
    phone: str
    email: str
    address: str


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
