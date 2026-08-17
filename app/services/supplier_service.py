from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.supplier import Supplier


def get_suppliers_for_business(business_id):
    db = SessionLocal()

    try:
        return (
            db.query(Supplier)
            .filter(Supplier.business_id == business_id)
            .all()
        )

    finally:
        db.close()


def create_supplier(supplier, business_id):
    db = SessionLocal()

    try:
        new_supplier = Supplier(
            business_id=business_id,
            name=supplier.name,
            contact_person=supplier.contact_person,
            phone=supplier.phone,
            email=supplier.email,
            address=supplier.address
        )

        db.add(new_supplier)
        db.commit()
        db.refresh(new_supplier)

        return new_supplier

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid supplier data"
        )

    finally:
        db.close()


def update_supplier(supplier_id, supplier_update, business_id):
    db = SessionLocal()

    try:
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

        updates = supplier_update.model_dump(exclude_unset=True)

        for field, value in updates.items():
            setattr(supplier, field, value)

        db.commit()
        db.refresh(supplier)

        return supplier

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid supplier data"
        )

    finally:
        db.close()


def archive_supplier(supplier_id, business_id):
    db = SessionLocal()

    try:
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

        supplier.status = "archived"

        db.commit()
        db.refresh(supplier)

        return supplier

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid supplier data"
        )

    finally:
        db.close()
