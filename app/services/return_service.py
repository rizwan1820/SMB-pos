from decimal import Decimal, ROUND_HALF_UP
from importlib import import_module

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.inventory_movement import InventoryMovement
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.refund import Refund
from app.models.return_item import ReturnItem


Return = import_module("app.models.return").Return

MONEY = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY, rounding=ROUND_HALF_UP)


def decimal_value(value) -> Decimal:
    return Decimal(str(value))


def return_response(return_record, return_items, refund):
    return {
        "id": return_record.id,
        "order_id": return_record.order_id,
        "customer_id": return_record.customer_id,
        "reason": return_record.reason,
        "status": return_record.status,
        "restock": return_record.restock,
        "total_refund_amount": return_record.total_refund_amount,
        "created_by": return_record.created_by,
        "created_at": return_record.created_at,
        "refund": {
            "id": refund.id,
            "method": refund.method,
            "amount": refund.amount,
            "status": refund.status,
            "reference": refund.reference,
            "created_at": refund.created_at,
        },
        "items": [
            {
                "id": item.id,
                "order_item_id": item.order_item_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "discount_amount": item.discount_amount,
                "tax_amount": item.tax_amount,
                "line_total": item.line_total,
            }
            for item in return_items
        ],
    }


def return_summary_response(return_record, refund):
    return {
        "id": return_record.id,
        "order_id": return_record.order_id,
        "reason": return_record.reason,
        "restock": return_record.restock,
        "refund_amount": refund.amount if refund else None,
        "refund_method": refund.method if refund else None,
        "refund_status": refund.status if refund else None,
        "created_at": return_record.created_at,
    }


def return_detail_response(return_record, return_items, refund, order, invoice):
    response = return_response(
        return_record,
        return_items,
        refund,
    )

    response["order"] = {
        "id": order.id,
        "status": order.status,
        "subtotal": order.subtotal,
        "discount_amount": order.discount_amount,
        "tax_amount": order.tax_amount,
        "total_amount": order.total_amount,
        "created_at": order.created_at,
    }

    response["invoice"] = (
        {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "invoice_date": invoice.invoice_date,
        }
        if invoice
        else None
    )

    return response


def get_returns(current_user):
    db = SessionLocal()

    try:
        returns = (
            db.query(Return)
            .filter(Return.business_id == current_user.business_id)
            .order_by(Return.created_at.desc())
            .all()
        )

        return_ids = [
            return_record.id
            for return_record in returns
        ]

        refunds = (
            db.query(Refund)
            .filter(
                Refund.business_id == current_user.business_id,
                Refund.return_id.in_(return_ids),
            )
            .all()
            if return_ids
            else []
        )

        refund_by_return_id = {
            refund.return_id: refund
            for refund in refunds
        }

        return [
            return_summary_response(
                return_record,
                refund_by_return_id.get(return_record.id),
            )
            for return_record in returns
        ]

    finally:
        db.close()


def get_return(return_id, current_user):
    db = SessionLocal()

    try:
        return_record = (
            db.query(Return)
            .filter(
                Return.id == return_id,
                Return.business_id == current_user.business_id,
            )
            .first()
        )

        if not return_record:
            raise HTTPException(
                status_code=404,
                detail="Return not found",
            )

        return_items = (
            db.query(ReturnItem)
            .filter(ReturnItem.return_id == return_record.id)
            .all()
        )

        refund = (
            db.query(Refund)
            .filter(
                Refund.return_id == return_record.id,
                Refund.business_id == current_user.business_id,
            )
            .first()
        )

        if not refund:
            raise HTTPException(
                status_code=404,
                detail="Refund not found",
            )

        order = (
            db.query(Order)
            .filter(
                Order.id == return_record.order_id,
                Order.business_id == current_user.business_id,
            )
            .first()
        )

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        invoice = (
            db.query(Invoice)
            .filter(
                Invoice.order_id == order.id,
                Invoice.business_id == current_user.business_id,
            )
            .first()
        )

        return return_detail_response(
            return_record,
            return_items,
            refund,
            order,
            invoice,
        )

    finally:
        db.close()


def calculate_return_amounts(order_item, quantity, returned_totals):
    original_quantity = decimal_value(order_item.quantity)
    requested_quantity = decimal_value(quantity)
    already_returned_quantity = returned_totals["quantity"]
    remaining_quantity = original_quantity - already_returned_quantity

    remaining_discount = money(
        decimal_value(order_item.discount_amount)
        - returned_totals["discount_amount"]
    )
    remaining_tax = money(
        decimal_value(order_item.tax_amount)
        - returned_totals["tax_amount"]
    )
    remaining_line_total = money(
        decimal_value(order_item.line_total)
        - returned_totals["line_total"]
    )

    if requested_quantity == remaining_quantity:
        return {
            "discount_amount": remaining_discount,
            "tax_amount": remaining_tax,
            "line_total": remaining_line_total,
        }

    ratio = requested_quantity / original_quantity

    discount_amount = money(
        decimal_value(order_item.discount_amount) * ratio
    )
    tax_amount = money(
        decimal_value(order_item.tax_amount) * ratio
    )
    line_total = money(
        decimal_value(order_item.line_total) * ratio
    )

    return {
        "discount_amount": min(discount_amount, remaining_discount),
        "tax_amount": min(tax_amount, remaining_tax),
        "line_total": min(line_total, remaining_line_total),
    }


def create_return(return_data, current_user):
    db = SessionLocal()

    try:
        order = (
            db.query(Order)
            .filter(
                Order.id == return_data.order_id,
                Order.business_id == current_user.business_id,
            )
            .with_for_update()
            .first()
        )

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        if order.status != "completed":
            raise HTTPException(
                status_code=400,
                detail="Only completed orders can be returned",
            )

        requested_quantities = {}

        for item in return_data.items:
            if item.order_item_id in requested_quantities:
                raise HTTPException(
                    status_code=400,
                    detail="Duplicate order item in return request",
                )

            quantity = decimal_value(item.quantity)

            if quantity <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="Return quantity must be greater than 0",
                )

            requested_quantities[item.order_item_id] = quantity

        order_item_ids = list(requested_quantities.keys())

        order_items = (
            db.query(OrderItem)
            .filter(
                OrderItem.id.in_(order_item_ids),
                OrderItem.order_id == order.id,
            )
            .with_for_update()
            .all()
        )

        order_item_by_id = {
            item.id: item
            for item in order_items
        }

        if len(order_item_by_id) != len(order_item_ids):
            raise HTTPException(
                status_code=400,
                detail="Return item does not belong to this order",
            )

        returned_rows = (
            db.query(
                ReturnItem.order_item_id,
                func.coalesce(func.sum(ReturnItem.quantity), 0).label(
                    "quantity"
                ),
                func.coalesce(
                    func.sum(ReturnItem.discount_amount),
                    0,
                ).label("discount_amount"),
                func.coalesce(
                    func.sum(ReturnItem.tax_amount),
                    0,
                ).label("tax_amount"),
                func.coalesce(
                    func.sum(ReturnItem.line_total),
                    0,
                ).label("line_total"),
            )
            .join(Return, Return.id == ReturnItem.return_id)
            .filter(
                Return.business_id == current_user.business_id,
                Return.order_id == order.id,
                Return.status == "completed",
                ReturnItem.order_item_id.in_(order_item_ids),
            )
            .group_by(ReturnItem.order_item_id)
            .all()
        )

        returned_by_order_item_id = {
            row.order_item_id: {
                "quantity": decimal_value(row.quantity),
                "discount_amount": money(
                    decimal_value(row.discount_amount)
                ),
                "tax_amount": money(decimal_value(row.tax_amount)),
                "line_total": money(decimal_value(row.line_total)),
            }
            for row in returned_rows
        }

        calculated_items = []
        total_refund_amount = Decimal("0.00")

        for order_item_id, requested_quantity in requested_quantities.items():
            order_item = order_item_by_id[order_item_id]
            returned_totals = returned_by_order_item_id.get(
                order_item_id,
                {
                    "quantity": Decimal("0.000"),
                    "discount_amount": Decimal("0.00"),
                    "tax_amount": Decimal("0.00"),
                    "line_total": Decimal("0.00"),
                },
            )

            remaining_quantity = (
                decimal_value(order_item.quantity)
                - returned_totals["quantity"]
            )

            if requested_quantity > remaining_quantity:
                raise HTTPException(
                    status_code=400,
                    detail="Return quantity exceeds remaining quantity",
                )

            amounts = calculate_return_amounts(
                order_item,
                requested_quantity,
                returned_totals,
            )

            total_refund_amount += amounts["line_total"]

            calculated_items.append(
                {
                    "order_item": order_item,
                    "quantity": requested_quantity,
                    **amounts,
                }
            )

        total_refund_amount = money(total_refund_amount)

        return_record = Return(
            business_id=current_user.business_id,
            order_id=order.id,
            customer_id=order.customer_id,
            reason=return_data.reason,
            status="completed",
            restock=return_data.restock,
            total_refund_amount=total_refund_amount,
            created_by=current_user.id,
        )

        db.add(return_record)
        db.flush()

        return_items = []

        for item in calculated_items:
            order_item = item["order_item"]

            return_item = ReturnItem(
                return_id=return_record.id,
                order_item_id=order_item.id,
                product_id=order_item.product_id,
                quantity=item["quantity"],
                unit_price=order_item.unit_price,
                discount_amount=item["discount_amount"],
                tax_amount=item["tax_amount"],
                line_total=item["line_total"],
            )

            db.add(return_item)
            return_items.append(return_item)

            if return_data.restock:
                movement = InventoryMovement(
                    business_id=current_user.business_id,
                    product_id=order_item.product_id,
                    movement_type="return",
                    quantity=item["quantity"],
                    reference=str(return_record.id),
                    notes=f"Return for order {order.id}",
                    created_by=current_user.id,
                )

                db.add(movement)

        refund_method = return_data.refund_method

        if hasattr(refund_method, "value"):
            refund_method = refund_method.value

        refund = Refund(
            return_id=return_record.id,
            business_id=current_user.business_id,
            order_id=order.id,
            method=refund_method,
            amount=total_refund_amount,
            status="completed",
            reference=return_data.refund_reference,
        )

        db.add(refund)

        db.commit()

        db.refresh(return_record)
        db.refresh(refund)

        for item in return_items:
            db.refresh(item)

        return return_response(
            return_record,
            return_items,
            refund,
        )

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Return could not be completed",
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
