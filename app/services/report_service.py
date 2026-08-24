from datetime import date, datetime, time, timezone
from decimal import Decimal
from importlib import import_module

from fastapi import HTTPException
from sqlalchemy import func

from app.database.connection import SessionLocal
from app.models.customer import Customer
from app.models.inventory_movement import InventoryMovement
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.product import Product
from app.models.refund import Refund
from app.schemas.report import ReportRange


Return = import_module("app.models.return").Return


def decimal_value(value) -> Decimal:
    return Decimal(str(value or 0))


def day_start(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def resolve_date_range(
    range_name: ReportRange,
    start_date: date | None,
    end_date: date | None,
) -> tuple[datetime, datetime]:
    today = datetime.now(timezone.utc).date()

    if range_name == ReportRange.today:
        start = today
        end = today
    elif range_name == ReportRange.last_7_days:
        start = date.fromordinal(today.toordinal() - 6)
        end = today
    elif range_name == ReportRange.this_month:
        start = today.replace(day=1)
        end = today
    elif range_name == ReportRange.custom:
        if start_date is None or end_date is None:
            raise HTTPException(
                status_code=400,
                detail="Custom range requires start_date and end_date",
            )

        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="start_date cannot be after end_date",
            )

        start = start_date
        end = end_date
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report range",
        )

    end_exclusive = date.fromordinal(end.toordinal() + 1)

    return day_start(start), day_start(end_exclusive)


def date_filtered(query, column, start_at: datetime, end_at: datetime):
    return query.filter(
        column >= start_at,
        column < end_at,
    )


def utc_day(column):
    return func.date_trunc("day", func.timezone("UTC", column))


def completed_orders_query(db, business_id, start_at, end_at):
    query = db.query(Order).filter(
        Order.business_id == business_id,
        Order.status == "completed",
    )

    return date_filtered(query, Order.created_at, start_at, end_at)


def completed_refunds_query(db, business_id, start_at, end_at):
    query = db.query(Refund).filter(
        Refund.business_id == business_id,
        Refund.status == "completed",
    )

    return date_filtered(query, Refund.created_at, start_at, end_at)


def low_stock_query(db, business_id):
    stock_totals = (
        db.query(
            InventoryMovement.product_id.label("product_id"),
            func.sum(InventoryMovement.quantity).label("current_stock"),
        )
        .filter(InventoryMovement.business_id == business_id)
        .group_by(InventoryMovement.product_id)
        .subquery()
    )

    current_stock = func.coalesce(stock_totals.c.current_stock, 0)

    return (
        db.query(
            Product.id,
            Product.name,
            Product.sku,
            Product.low_stock_threshold,
            current_stock.label("current_stock"),
        )
        .outerjoin(stock_totals, Product.id == stock_totals.c.product_id)
        .filter(
            Product.business_id == business_id,
            Product.status.not_ilike("archived"),
            current_stock <= Product.low_stock_threshold,
        )
    )


def get_dashboard(range_name, start_date, end_date, current_user):
    db = SessionLocal()

    try:
        start_at, end_at = resolve_date_range(
            range_name,
            start_date,
            end_date,
        )

        sales_row = (
            completed_orders_query(
                db,
                current_user.business_id,
                start_at,
                end_at,
            )
            .with_entities(
                func.coalesce(func.sum(Order.total_amount), 0),
                func.count(Order.id),
            )
            .one()
        )

        total_refunds = completed_refunds_query(
            db,
            current_user.business_id,
            start_at,
            end_at,
        ).with_entities(func.coalesce(func.sum(Refund.amount), 0)).scalar()

        total_sales = decimal_value(sales_row[0])
        order_count = sales_row[1]
        total_refunds = decimal_value(total_refunds)

        return {
            "total_sales": total_sales,
            "order_count": order_count,
            "total_refunds": total_refunds,
            "net_sales": total_sales - total_refunds,
            "low_stock_count": low_stock_query(
                db,
                current_user.business_id,
            ).count(),
        }

    finally:
        db.close()


def get_sales_report(range_name, start_date, end_date, current_user):
    db = SessionLocal()

    try:
        start_at, end_at = resolve_date_range(
            range_name,
            start_date,
            end_date,
        )

        order_day = utc_day(Order.created_at).label("date")
        sales_over_time = (
            completed_orders_query(
                db,
                current_user.business_id,
                start_at,
                end_at,
            )
            .with_entities(
                order_day,
                func.coalesce(func.sum(Order.total_amount), 0).label(
                    "total_sales"
                ),
                func.count(Order.id).label("order_count"),
            )
            .group_by(order_day)
            .order_by(order_day)
            .all()
        )

        payment_methods = (
            date_filtered(
                db.query(
                    Payment.method,
                    func.count(Payment.id).label("count"),
                    func.coalesce(func.sum(Payment.amount), 0).label("amount"),
                ).filter(
                    Payment.business_id == current_user.business_id,
                    Payment.status == "completed",
                ),
                Payment.created_at,
                start_at,
                end_at,
            )
            .group_by(Payment.method)
            .order_by(Payment.method)
            .all()
        )

        order_totals = (
            completed_orders_query(
                db,
                current_user.business_id,
                start_at,
                end_at,
            )
            .with_entities(
                Order.id,
                Order.created_at,
                Order.total_amount,
                Order.status,
            )
            .order_by(Order.created_at.desc())
            .all()
        )

        return {
            "sales_over_time": [
                {
                    "date": row.date.date().isoformat(),
                    "total_sales": row.total_sales,
                    "order_count": row.order_count,
                }
                for row in sales_over_time
            ],
            "payment_methods": [
                {
                    "method": row.method,
                    "count": row.count,
                    "amount": row.amount,
                }
                for row in payment_methods
            ],
            "order_totals": [
                {
                    "order_id": row.id,
                    "created_at": row.created_at,
                    "total_amount": row.total_amount,
                    "status": row.status,
                }
                for row in order_totals
            ],
        }

    finally:
        db.close()


def get_products_report(range_name, start_date, end_date, current_user):
    db = SessionLocal()

    try:
        start_at, end_at = resolve_date_range(
            range_name,
            start_date,
            end_date,
        )

        base_filters = (
            Product.business_id == current_user.business_id,
            Order.business_id == current_user.business_id,
            Order.status == "completed",
            Order.created_at >= start_at,
            Order.created_at < end_at,
        )

        top_by_quantity = (
            db.query(
                Product.id.label("product_id"),
                Product.name,
                Product.sku,
                func.coalesce(func.sum(OrderItem.quantity), 0).label(
                    "quantity"
                ),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(*base_filters)
            .group_by(Product.id, Product.name, Product.sku)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(10)
            .all()
        )

        top_by_revenue = (
            db.query(
                Product.id.label("product_id"),
                Product.name,
                Product.sku,
                func.coalesce(func.sum(OrderItem.line_total), 0).label(
                    "revenue"
                ),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(*base_filters)
            .group_by(Product.id, Product.name, Product.sku)
            .order_by(func.sum(OrderItem.line_total).desc())
            .limit(10)
            .all()
        )

        low_stock_products = low_stock_query(
            db,
            current_user.business_id,
        ).order_by(Product.name).all()

        return {
            "top_by_quantity": [
                {
                    "product_id": row.product_id,
                    "name": row.name,
                    "sku": row.sku,
                    "quantity": row.quantity,
                }
                for row in top_by_quantity
            ],
            "top_by_revenue": [
                {
                    "product_id": row.product_id,
                    "name": row.name,
                    "sku": row.sku,
                    "revenue": row.revenue,
                }
                for row in top_by_revenue
            ],
            "low_stock_products": [
                {
                    "product_id": row.id,
                    "name": row.name,
                    "sku": row.sku,
                    "current_stock": row.current_stock,
                    "low_stock_threshold": row.low_stock_threshold,
                }
                for row in low_stock_products
            ],
        }

    finally:
        db.close()


def get_customers_report(range_name, start_date, end_date, current_user):
    db = SessionLocal()

    try:
        start_at, end_at = resolve_date_range(
            range_name,
            start_date,
            end_date,
        )

        base_filters = (
            Order.business_id == current_user.business_id,
            Order.status == "completed",
            Order.customer_id.isnot(None),
            Order.created_at >= start_at,
            Order.created_at < end_at,
            Customer.business_id == current_user.business_id,
        )

        top_customers_by_spend = (
            db.query(
                Customer.id.label("customer_id"),
                Customer.name,
                func.coalesce(func.sum(Order.total_amount), 0).label("spend"),
            )
            .join(Order, Order.customer_id == Customer.id)
            .filter(*base_filters)
            .group_by(Customer.id, Customer.name)
            .order_by(func.sum(Order.total_amount).desc())
            .limit(10)
            .all()
        )

        customer_order_counts = (
            db.query(
                Customer.id.label("customer_id"),
                Customer.name,
                func.count(Order.id).label("order_count"),
            )
            .join(Order, Order.customer_id == Customer.id)
            .filter(*base_filters)
            .group_by(Customer.id, Customer.name)
            .order_by(func.count(Order.id).desc())
            .limit(10)
            .all()
        )

        return {
            "top_customers_by_spend": [
                {
                    "customer_id": row.customer_id,
                    "name": row.name,
                    "spend": row.spend,
                }
                for row in top_customers_by_spend
            ],
            "customer_order_counts": [
                {
                    "customer_id": row.customer_id,
                    "name": row.name,
                    "order_count": row.order_count,
                }
                for row in customer_order_counts
            ],
        }

    finally:
        db.close()


def get_returns_report(range_name, start_date, end_date, current_user):
    db = SessionLocal()

    try:
        start_at, end_at = resolve_date_range(
            range_name,
            start_date,
            end_date,
        )

        refund_total = completed_refunds_query(
            db,
            current_user.business_id,
            start_at,
            end_at,
        ).with_entities(func.coalesce(func.sum(Refund.amount), 0)).scalar()

        return_count = (
            date_filtered(
                db.query(func.count(Return.id)).filter(
                    Return.business_id == current_user.business_id,
                    Return.status == "completed",
                ),
                Return.created_at,
                start_at,
                end_at,
            ).scalar()
            or 0
        )

        return_day = utc_day(Return.created_at).label("date")

        daily_returns = (
            date_filtered(
                db.query(
                    return_day,
                    func.count(Return.id).label("return_count"),
                    func.coalesce(
                        func.sum(Return.total_refund_amount),
                        0,
                    ).label("refund_total"),
                ).filter(
                    Return.business_id == current_user.business_id,
                    Return.status == "completed",
                ),
                Return.created_at,
                start_at,
                end_at,
            )
            .group_by(return_day)
            .order_by(return_day)
            .all()
        )

        return {
            "refund_total": decimal_value(refund_total),
            "return_count": return_count,
            "daily": [
                {
                    "date": row.date.date().isoformat(),
                    "refund_total": row.refund_total,
                    "return_count": row.return_count,
                }
                for row in daily_returns
            ],
        }

    finally:
        db.close()
