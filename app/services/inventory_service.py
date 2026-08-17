from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product


def create_opening_stock(stock, current_user):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == stock.product_id,
                Product.business_id == current_user.business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        if stock.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Opening stock quantity must be greater than 0"
            )

        movement = InventoryMovement(
            business_id=current_user.business_id,
            product_id=stock.product_id,
            movement_type="opening",
            quantity=stock.quantity,
            reference=stock.reference,
            notes=stock.notes,
            created_by=current_user.id
        )

        db.add(movement)
        db.commit()
        db.refresh(movement)

        return movement

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid inventory data"
        )

    finally:
        db.close()


def receive_stock(stock, current_user):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == stock.product_id,
                Product.business_id == current_user.business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        if stock.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Received quantity must be greater than 0"
            )

        movement = InventoryMovement(
            business_id=current_user.business_id,
            product_id=stock.product_id,
            movement_type="received",
            quantity=stock.quantity,
            reference=stock.reference,
            notes=stock.notes,
            created_by=current_user.id
        )

        db.add(movement)
        db.commit()
        db.refresh(movement)

        return movement

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid inventory data"
        )

    finally:
        db.close()


def get_product_stock(product_id, current_user):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.business_id == current_user.business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        current_stock = (
            db.query(func.sum(InventoryMovement.quantity))
            .filter(
                InventoryMovement.product_id == product_id,
                InventoryMovement.business_id == current_user.business_id
            )
            .scalar()
        )

        return {
            "product_id": product_id,
            "current_stock": current_stock or 0
        }

    finally:
        db.close()


def get_low_stock_products(current_user):
    db = SessionLocal()

    try:
        stock_totals = (
            db.query(
                InventoryMovement.product_id.label("product_id"),
                func.sum(InventoryMovement.quantity).label("current_stock")
            )
            .filter(
                InventoryMovement.business_id == current_user.business_id
            )
            .group_by(InventoryMovement.product_id)
            .subquery()
        )

        current_stock = func.coalesce(stock_totals.c.current_stock, 0)

        products = (
            db.query(
                Product.id,
                Product.name,
                Product.sku,
                Product.low_stock_threshold,
                current_stock.label("current_stock")
            )
            .outerjoin(
                stock_totals,
                Product.id == stock_totals.c.product_id
            )
            .filter(
                Product.business_id == current_user.business_id,
                Product.status.not_ilike("archived"),
                current_stock <= Product.low_stock_threshold
            )
            .all()
        )

        return [
            {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "current_stock": product.current_stock,
                "low_stock_threshold": product.low_stock_threshold
            }
            for product in products
        ]

    finally:
        db.close()


def adjust_stock(adjustment, current_user):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == adjustment.product_id,
                Product.business_id == current_user.business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        if adjustment.quantity == 0:
            raise HTTPException(
                status_code=400,
                detail="Adjustment quantity cannot be 0"
            )

        movement = InventoryMovement(
            business_id=current_user.business_id,
            product_id=adjustment.product_id,
            movement_type="adjustment",
            quantity=adjustment.quantity,
            reference=adjustment.reference,
            notes=adjustment.notes,
            created_by=current_user.id
        )

        db.add(movement)
        db.commit()
        db.refresh(movement)

        return movement

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid inventory adjustment"
        )

    finally:
        db.close()


def get_product_movements(product_id, current_user):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.business_id == current_user.business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        movements = (
            db.query(InventoryMovement)
            .filter(
                InventoryMovement.product_id == product_id,
                InventoryMovement.business_id == current_user.business_id
            )
            .order_by(InventoryMovement.created_at.desc())
            .all()
        )

        return [
            {
                "movement_type": movement.movement_type,
                "quantity": movement.quantity,
                "reference": movement.reference,
                "notes": movement.notes,
                "created_by": movement.created_by,
                "created_at": movement.created_at
            }
            for movement in movements
        ]

    finally:
        db.close()
