from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.customer import Customer


def create_customer(customer, current_user):
    db = SessionLocal()

    try:
        new_customer = Customer(
            business_id=current_user.business_id,
            name=customer.name,
            phone=customer.phone,
            email=customer.email,
            address=customer.address
        )

        db.add(new_customer)
        db.commit()
        db.refresh(new_customer)

        return new_customer

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid customer data"
        )

    finally:
        db.close()


def get_customers_for_business(business_id, search=None):
    db = SessionLocal()

    try:
        query = db.query(Customer).filter(Customer.business_id == business_id)

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.name.ilike(search_value),
                    Customer.phone.ilike(search_value),
                    Customer.email.ilike(search_value)
                )
            )

        return query.all()

    finally:
        db.close()


def get_customer(customer_id, business_id):
    db = SessionLocal()

    try:
        customer = (
            db.query(Customer)
            .filter(
                Customer.id == customer_id,
                Customer.business_id == business_id
            )
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

        return customer

    finally:
        db.close()


def update_customer(customer_id, customer_update, business_id):
    db = SessionLocal()

    try:
        customer = (
            db.query(Customer)
            .filter(
                Customer.id == customer_id,
                Customer.business_id == business_id
            )
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

        updates = customer_update.model_dump(exclude_unset=True)

        for field, value in updates.items():
            setattr(customer, field, value)

        db.commit()
        db.refresh(customer)

        return customer

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid customer data"
        )

    finally:
        db.close()


def archive_customer(customer_id, business_id):
    db = SessionLocal()

    try:
        customer = (
            db.query(Customer)
            .filter(
                Customer.id == customer_id,
                Customer.business_id == business_id
            )
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

        customer.status = "archived"

        db.commit()
        db.refresh(customer)

        return customer

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid customer data"
        )

    finally:
        db.close()
