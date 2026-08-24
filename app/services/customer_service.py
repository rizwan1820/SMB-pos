from importlib import import_module

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.payment import Payment
from app.models.refund import Refund


Return = import_module("app.models.return").Return


def create_customer(customer, current_user):
    db = SessionLocal()

    try:
        new_customer = Customer(
            business_id=current_user.business_id,
            name=customer.name,
            phone=customer.phone,
            email=customer.email,
            address=customer.address,
            customer_type=customer.customer_type,
            notes=customer.notes
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


def get_customer_profile(customer_id, current_user):
    db = SessionLocal()

    try:
        customer = (
            db.query(Customer)
            .filter(
                Customer.id == customer_id,
                Customer.business_id == current_user.business_id
            )
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

        summary = (
            db.query(
                func.count(Order.id).label("total_orders"),
                func.coalesce(func.sum(Order.total_amount), 0).label(
                    "total_spend"
                ),
                func.max(Order.created_at).label("last_purchase_date")
            )
            .filter(
                Order.business_id == current_user.business_id,
                Order.customer_id == customer.id,
                Order.status == "completed"
            )
            .one()
        )

        order_rows = (
            db.query(
                Order,
                Payment.method.label("payment_method"),
                Payment.status.label("payment_status"),
                Invoice.id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),
            )
            .outerjoin(
                Payment,
                (Payment.order_id == Order.id)
                & (Payment.business_id == current_user.business_id),
            )
            .outerjoin(
                Invoice,
                (Invoice.order_id == Order.id)
                & (Invoice.business_id == current_user.business_id),
            )
            .filter(
                Order.business_id == current_user.business_id,
                Order.customer_id == customer.id,
            )
            .order_by(Order.created_at.desc())
            .all()
        )

        return_rows = (
            db.query(
                Return,
                Refund.method.label("refund_method"),
                Refund.status.label("refund_status"),
                Refund.reference.label("refund_reference"),
                Refund.amount.label("refund_amount"),
            )
            .join(
                Order,
                (Order.id == Return.order_id)
                & (Order.business_id == current_user.business_id),
            )
            .outerjoin(
                Refund,
                (Refund.return_id == Return.id)
                & (Refund.business_id == current_user.business_id),
            )
            .filter(
                Return.business_id == current_user.business_id,
                Order.customer_id == customer.id,
            )
            .order_by(Return.created_at.desc())
            .all()
        )

        return {
            "customer": {
                "id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email,
                "address": customer.address,
                "customer_type": customer.customer_type,
                "notes": customer.notes,
                "status": customer.status,
            },
            "summary": {
                "total_orders": summary.total_orders,
                "total_spend": summary.total_spend,
                "last_purchase_date": summary.last_purchase_date,
            },
            "orders": [
                {
                    "order_id": order.id,
                    "created_at": order.created_at,
                    "status": order.status,
                    "subtotal": order.subtotal,
                    "discount_amount": order.discount_amount,
                    "tax_amount": order.tax_amount,
                    "total_amount": order.total_amount,
                    "payment_method": payment_method,
                    "payment_status": payment_status,
                    "invoice_id": invoice_id,
                    "invoice_number": invoice_number,
                }
                for (
                    order,
                    payment_method,
                    payment_status,
                    invoice_id,
                    invoice_number,
                ) in order_rows
            ],
            "returns": [
                {
                    "return_id": return_record.id,
                    "order_id": return_record.order_id,
                    "created_at": return_record.created_at,
                    "reason": return_record.reason,
                    "status": return_record.status,
                    "restock": return_record.restock,
                    "total_refund_amount": return_record.total_refund_amount,
                    "refund_method": refund_method,
                    "refund_status": refund_status,
                    "refund_reference": refund_reference,
                    "refund_amount": refund_amount,
                }
                for (
                    return_record,
                    refund_method,
                    refund_status,
                    refund_reference,
                    refund_amount,
                ) in return_rows
            ],
        }

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
