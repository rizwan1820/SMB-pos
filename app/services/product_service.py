from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.category import Category
from app.models.product import Product
from app.models.product_supplier import ProductSupplier
from app.models.supplier import Supplier


def get_products_for_business(
    business_id,
    search=None,
    category_id=None,
    status=None
):
    db = SessionLocal()

    try:
        query = db.query(Product).filter(Product.business_id == business_id)

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_value),
                    Product.sku.ilike(search_value)
                )
            )

        if category_id:
            query = query.filter(Product.category_id == category_id)

        if status:
            query = query.filter(Product.status == status)

        return query.all()

    finally:
        db.close()


def create_product(product, business_id):
    db = SessionLocal()

    try:
        category = (
            db.query(Category)
            .filter(
                Category.id == product.category_id,
                Category.business_id == business_id
            )
            .first()
        )

        if not category:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )

        new_product = Product(
            business_id=business_id,
            category_id=product.category_id,
            name=product.name,
            sku=product.sku,
            barcode=product.barcode,
            cost_price=product.cost_price,
            selling_price=product.selling_price,
            tax_rate=product.tax_rate,
            low_stock_threshold=product.low_stock_threshold
        )

        db.add(new_product)
        db.commit()
        db.refresh(new_product)

        return new_product

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid product data"
        )

    finally:
        db.close()


def update_product(product_id, product_update, business_id):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.business_id == business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        updates = product_update.model_dump(exclude_unset=True)

        if "category_id" in updates:
            category = (
                db.query(Category)
                .filter(
                    Category.id == updates["category_id"],
                    Category.business_id == business_id
                )
                .first()
            )

            if not category:
                raise HTTPException(
                    status_code=404,
                    detail="Category not found"
                )

        for field, value in updates.items():
            setattr(product, field, value)

        db.commit()
        db.refresh(product)

        return product

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid product data"
        )

    finally:
        db.close()


def archive_product(product_id, business_id):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.business_id == business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        product.status = "archived"

        db.commit()
        db.refresh(product)

        return product

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid product data"
        )

    finally:
        db.close()


def assign_supplier_to_product(product_id, supplier_id, business_id):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.business_id == business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        supplier = (
            db.query(Supplier)
            .filter(
                Supplier.id == supplier_id,
                Supplier.business_id == business_id
            )
            .first()
        )

        if not supplier:
            raise HTTPException(
                status_code=404,
                detail="Supplier not found"
            )

        existing_link = db.get(
            ProductSupplier,
            {
                "product_id": product_id,
                "supplier_id": supplier_id
            }
        )

        if existing_link:
            raise HTTPException(
                status_code=400,
                detail="Supplier already assigned to product"
            )

        product_supplier = ProductSupplier(
            product_id=product_id,
            supplier_id=supplier_id
        )

        db.add(product_supplier)
        db.commit()
        db.refresh(product_supplier)

        return product_supplier

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid product supplier data"
        )

    finally:
        db.close()


def get_suppliers_for_product(product_id, business_id):
    db = SessionLocal()

    try:
        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.business_id == business_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return (
            db.query(Supplier)
            .join(
                ProductSupplier,
                ProductSupplier.supplier_id == Supplier.id
            )
            .filter(
                ProductSupplier.product_id == product_id,
                Supplier.business_id == business_id
            )
            .all()
        )

    finally:
        db.close()
