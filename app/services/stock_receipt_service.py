from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product
from app.models.profile import Profile
from app.models.stock_receipt import StockReceipt
from app.models.stock_receipt_item import StockReceiptItem
from app.models.supplier import Supplier


MONEY_QUANT = Decimal("0.01")


def money(value: Decimal):
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def receipt_notes(receipt, supplier):
    label = f"Supplier receipt {receipt.id}"

    if receipt.reference:
        label = f"{label} ({receipt.reference})"

    if supplier.name:
        label = f"{label} from {supplier.name}"

    if receipt.notes:
        return f"{label}. {receipt.notes}"

    return label


def create_stock_receipt(receipt_create, current_user):
    db = SessionLocal()

    try:
        business_id = current_user.business_id

        supplier = (
            db.query(Supplier)
            .filter(
                Supplier.id == receipt_create.supplier_id,
                Supplier.business_id == business_id,
                Supplier.status == "active",
            )
            .first()
        )

        if not supplier:
            raise HTTPException(
                status_code=404,
                detail="Supplier not found",
            )

        product_ids = [item.product_id for item in receipt_create.items]

        if len(product_ids) != len(set(product_ids)):
            raise HTTPException(
                status_code=400,
                detail="Duplicate product lines are not allowed",
            )

        products = (
            db.query(Product)
            .filter(
                Product.id.in_(product_ids),
                Product.business_id == business_id,
            )
            .all()
        )
        products_by_id = {product.id: product for product in products}

        if len(products_by_id) != len(product_ids):
            raise HTTPException(
                status_code=404,
                detail="Product not found",
            )

        for product in products:
            if product.status == "archived":
                raise HTTPException(
                    status_code=400,
                    detail="Archived products cannot be received",
                )

        line_data = []
        total_cost = Decimal("0.00")

        for item in receipt_create.items:
            unit_cost = money(item.unit_cost)
            line_total = money(item.quantity * unit_cost)

            line_data.append(
                {
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_cost": unit_cost,
                    "line_total": line_total,
                }
            )
            total_cost += line_total

        total_cost = money(total_cost)

        receipt = StockReceipt(
            business_id=business_id,
            supplier_id=supplier.id,
            receipt_date=receipt_create.receipt_date,
            reference=receipt_create.reference,
            notes=receipt_create.notes,
            total_cost=total_cost,
            status="completed",
            created_by=current_user.id,
        )

        db.add(receipt)
        db.flush()

        for line in line_data:
            receipt_item = StockReceiptItem(
                stock_receipt_id=receipt.id,
                product_id=line["product_id"],
                quantity=line["quantity"],
                unit_cost=line["unit_cost"],
                line_total=line["line_total"],
            )
            db.add(receipt_item)
            db.flush()

            movement = InventoryMovement(
                business_id=business_id,
                product_id=receipt_item.product_id,
                movement_type="received",
                quantity=receipt_item.quantity,
                reference=receipt.reference,
                notes=receipt_notes(receipt, supplier),
                created_by=current_user.id,
                stock_receipt_id=receipt.id,
                stock_receipt_item_id=receipt_item.id,
            )
            db.add(movement)

        db.commit()
        db.refresh(receipt)

        return get_stock_receipt(receipt.id, current_user)

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Invalid stock receipt data",
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def get_stock_receipts(current_user):
    db = SessionLocal()

    try:
        receipts = (
            db.query(StockReceipt, Supplier.name.label("supplier_name"))
            .join(
                Supplier,
                Supplier.id == StockReceipt.supplier_id,
            )
            .filter(
                StockReceipt.business_id == current_user.business_id,
                Supplier.business_id == current_user.business_id,
            )
            .order_by(
                StockReceipt.receipt_date.desc(),
                StockReceipt.created_at.desc(),
            )
            .all()
        )

        return [
            {
                "id": receipt.id,
                "supplier_id": receipt.supplier_id,
                "supplier_name": supplier_name,
                "receipt_date": receipt.receipt_date,
                "reference": receipt.reference,
                "total_cost": receipt.total_cost,
                "status": receipt.status,
                "created_at": receipt.created_at,
            }
            for receipt, supplier_name in receipts
        ]

    finally:
        db.close()


def get_stock_receipt(receipt_id, current_user):
    db = SessionLocal()

    try:
        result = (
            db.query(
                StockReceipt,
                Supplier,
                Profile.name.label("created_by_name"),
            )
            .join(
                Supplier,
                Supplier.id == StockReceipt.supplier_id,
            )
            .outerjoin(
                Profile,
                Profile.id == StockReceipt.created_by,
            )
            .filter(
                StockReceipt.id == receipt_id,
                StockReceipt.business_id == current_user.business_id,
                Supplier.business_id == current_user.business_id,
            )
            .first()
        )

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Stock receipt not found",
            )

        receipt, supplier, created_by_name = result

        item_rows = (
            db.query(StockReceiptItem, Product.name, Product.sku)
            .join(
                Product,
                Product.id == StockReceiptItem.product_id,
            )
            .filter(
                StockReceiptItem.stock_receipt_id == receipt.id,
                Product.business_id == current_user.business_id,
            )
            .all()
        )

        return {
            "id": receipt.id,
            "supplier": {
                "id": supplier.id,
                "name": supplier.name,
                "contact_person": supplier.contact_person,
                "phone": supplier.phone,
                "email": supplier.email,
            },
            "receipt_date": receipt.receipt_date,
            "reference": receipt.reference,
            "notes": receipt.notes,
            "total_cost": receipt.total_cost,
            "status": receipt.status,
            "created_by": receipt.created_by,
            "created_by_name": created_by_name,
            "created_at": receipt.created_at,
            "updated_at": receipt.updated_at,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": product_name,
                    "product_sku": product_sku,
                    "quantity": item.quantity,
                    "unit_cost": item.unit_cost,
                    "line_total": item.line_total,
                }
                for item, product_name, product_sku in item_rows
            ],
        }

    finally:
        db.close()
