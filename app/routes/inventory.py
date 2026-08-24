from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schemas.inventory import (
    OpeningStockCreate,
    StockAdjustmentCreate,
    StockReceiveCreate
)
from app.schemas.stock_receipt import (
    StockReceiptCreate,
    StockReceiptDetail,
    StockReceiptListItem,
)
from app.services import inventory_service, stock_receipt_service

router = APIRouter()


@router.post("/inventory/opening-stock")
def create_opening_stock(
    stock: OpeningStockCreate,
    current_user=Depends(get_current_user)
):
    return inventory_service.create_opening_stock(
        stock,
        current_user
    )


@router.post("/inventory/receive")
def receive_stock(
    stock: StockReceiveCreate,
    current_user=Depends(get_current_user)
):
    return inventory_service.receive_stock(
        stock,
        current_user
    )


@router.post("/inventory/receipts", response_model=StockReceiptDetail)
def create_stock_receipt(
    receipt: StockReceiptCreate,
    current_user=Depends(get_current_user)
):
    return stock_receipt_service.create_stock_receipt(
        receipt,
        current_user
    )


@router.get("/inventory/receipts", response_model=list[StockReceiptListItem])
def get_stock_receipts(current_user=Depends(get_current_user)):
    return stock_receipt_service.get_stock_receipts(current_user)


@router.get(
    "/inventory/receipts/{receipt_id}",
    response_model=StockReceiptDetail
)
def get_stock_receipt(
    receipt_id: UUID,
    current_user=Depends(get_current_user)
):
    return stock_receipt_service.get_stock_receipt(
        receipt_id,
        current_user
    )


@router.get("/inventory/low-stock")
def get_low_stock_products(current_user=Depends(get_current_user)):
    return inventory_service.get_low_stock_products(current_user)


@router.get("/inventory/products/{product_id}/stock")
def get_product_stock(
    product_id: UUID,
    current_user=Depends(get_current_user)
):
    return inventory_service.get_product_stock(
        product_id,
        current_user
    )


@router.get("/inventory/products/{product_id}/movements")
def get_product_movements(
    product_id: UUID,
    current_user=Depends(get_current_user)
):
    return inventory_service.get_product_movements(
        product_id,
        current_user
    )


@router.post("/inventory/adjust")
def adjust_stock(
    adjustment: StockAdjustmentCreate,
    current_user=Depends(get_current_user)
):
    return inventory_service.adjust_stock(
        adjustment,
        current_user
    )
