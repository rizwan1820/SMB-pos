from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.business import Business
from app.models.customer import Customer
from app.models.inventory_movement import InventoryMovement
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.product import Product
from app.schemas.order import CheckoutRequest


MONEY = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    """Round financial values to 2 decimal places."""
    return value.quantize(MONEY, rounding=ROUND_HALF_UP)


def generate_invoice_number(db, business_id):
    db.query(Business).filter(
        Business.id == business_id,
    ).with_for_update().one()

    latest_invoice_number = (
        db.query(Invoice.invoice_number)
        .filter(
            Invoice.business_id == business_id,
            Invoice.invoice_number.like("INV-%"),
        )
        .order_by(Invoice.invoice_number.desc())
        .limit(1)
        .scalar()
    )

    if latest_invoice_number:
        next_sequence = int(latest_invoice_number.removeprefix("INV-")) + 1
    else:
        next_sequence = 1

    return f"INV-{next_sequence:06d}"


def order_response(order, order_items=None, payment=None, invoice=None):
    response = {
        "id": order.id,
        "customer_id": order.customer_id,
        "subtotal": order.subtotal,
        "discount_amount": order.discount_amount,
        "tax_amount": order.tax_amount,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_by": order.created_by,
        "created_at": order.created_at,
    }

    if order_items is not None:
        response["items"] = [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "discount_amount": item.discount_amount,
                "tax_amount": item.tax_amount,
                "line_total": item.line_total,
            }
            for item in order_items
        ]

    if payment is not None:
        response["payment"] = {
            "id": payment.id,
            "method": payment.method,
            "amount": payment.amount,
            "status": payment.status,
            "reference": payment.reference,
            "created_at": payment.created_at,
        }

    if invoice is not None:
        response["invoice"] = {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "invoice_date": invoice.invoice_date,
        }

    return response


def get_orders(current_user):
    db = SessionLocal()

    try:
        orders = (
            db.query(Order)
            .filter(Order.business_id == current_user.business_id)
            .order_by(Order.created_at.desc())
            .all()
        )

        order_ids = [order.id for order in orders]

        invoices = (
            db.query(Invoice)
            .filter(
                Invoice.business_id == current_user.business_id,
                Invoice.order_id.in_(order_ids),
            )
            .all()
            if order_ids
            else []
        )

        invoice_by_order_id = {
            invoice.order_id: invoice
            for invoice in invoices
        }

        return [
            order_response(
                order,
                invoice=invoice_by_order_id.get(order.id),
            )
            for order in orders
        ]

    finally:
        db.close()


def get_order(order_id, current_user):
    db = SessionLocal()

    try:
        order = (
            db.query(Order)
            .filter(
                Order.id == order_id,
                Order.business_id == current_user.business_id,
            )
            .first()
        )

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        order_items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order.id)
            .all()
        )

        payment = (
            db.query(Payment)
            .filter(
                Payment.order_id == order.id,
                Payment.business_id == current_user.business_id,
            )
            .first()
        )

        invoice = (
            db.query(Invoice)
            .filter(
                Invoice.order_id == order.id,
                Invoice.business_id == current_user.business_id,
            )
            .first()
        )

        return order_response(order, order_items, payment, invoice)

    finally:
        db.close()


def checkout(checkout_data: CheckoutRequest, current_user):
    db = SessionLocal()

    try:
        # ---------------------------------------------------------
        # 1. Validate optional customer
        # ---------------------------------------------------------
        if checkout_data.customer_id:
            customer = (
                db.query(Customer)
                .filter(
                    Customer.id == checkout_data.customer_id,
                    Customer.business_id == current_user.business_id,
                    Customer.status != "archived",
                )
                .first()
            )

            if not customer:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found",
                )

        # ---------------------------------------------------------
        # 2. Combine duplicate products from the request
        # ---------------------------------------------------------
        requested_quantities = {}

        for item in checkout_data.items:
            quantity = Decimal(str(item.quantity))

            if item.product_id in requested_quantities:
                requested_quantities[item.product_id] += quantity
            else:
                requested_quantities[item.product_id] = quantity

        # ---------------------------------------------------------
        # 3. Validate products, stock and trusted prices
        # ---------------------------------------------------------
        subtotal = Decimal("0.00")
        prepared_items = []

        # Sort IDs so concurrent checkouts lock products consistently.
        product_ids = sorted(
            requested_quantities.keys(),
            key=str,
        )

        for product_id in product_ids:
            quantity = requested_quantities[product_id]

            product = (
                db.query(Product)
                .filter(
                    Product.id == product_id,
                    Product.business_id == current_user.business_id,
                    Product.status != "archived",
                )
                .with_for_update()
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail="Product not found",
                )

            current_stock = (
                db.query(
                    func.coalesce(
                        func.sum(InventoryMovement.quantity),
                        0,
                    )
                )
                .filter(
                    InventoryMovement.product_id == product.id,
                    InventoryMovement.business_id
                    == current_user.business_id,
                )
                .scalar()
            )

            current_stock = Decimal(str(current_stock))

            if current_stock < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Insufficient stock for {product.name}. "
                        f"Available: {current_stock}"
                    ),
                )

            unit_price = Decimal(str(product.selling_price))
            tax_rate = Decimal(str(product.tax_rate))

            line_subtotal = money(unit_price * quantity)

            subtotal += line_subtotal

            prepared_items.append(
                {
                    "product": product,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "tax_rate": tax_rate,
                    "line_subtotal": line_subtotal,
                }
            )

        subtotal = money(subtotal)

        # ---------------------------------------------------------
        # 4. Validate order-level discount
        # ---------------------------------------------------------
        discount_amount = money(
            Decimal(str(checkout_data.discount_amount))
        )

        if discount_amount > subtotal:
            raise HTTPException(
                status_code=400,
                detail="Discount cannot exceed subtotal",
            )

        # ---------------------------------------------------------
        # 5. Allocate discount and calculate tax
        # ---------------------------------------------------------
        tax_amount = Decimal("0.00")
        calculated_items = []

        allocated_discount = Decimal("0.00")

        for index, item in enumerate(prepared_items):
            line_subtotal = item["line_subtotal"]

            # Allocate the order discount proportionally.
            if subtotal > 0 and discount_amount > 0:
                if index == len(prepared_items) - 1:
                    # Give the last line any rounding remainder.
                    line_discount = money(
                        discount_amount - allocated_discount
                    )
                else:
                    ratio = line_subtotal / subtotal
                    line_discount = money(
                        discount_amount * ratio
                    )
                    allocated_discount += line_discount
            else:
                line_discount = Decimal("0.00")

            taxable_amount = money(
                line_subtotal - line_discount
            )

            line_tax = money(
                taxable_amount
                * item["tax_rate"]
                / Decimal("100")
            )

            line_total = money(
                taxable_amount + line_tax
            )

            tax_amount += line_tax

            calculated_items.append(
                {
                    **item,
                    "discount_amount": line_discount,
                    "tax_amount": line_tax,
                    "line_total": line_total,
                }
            )

        tax_amount = money(tax_amount)

        total_amount = money(
            subtotal
            - discount_amount
            + tax_amount
        )

        # ---------------------------------------------------------
        # 6. Create the Order
        # ---------------------------------------------------------
        order = Order(
            business_id=current_user.business_id,
            customer_id=checkout_data.customer_id,
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            status="completed",
            created_by=current_user.id,
        )

        db.add(order)

        # Flush sends INSERT to DB without committing.
        # We need order.id for order_items/payment/movements.
        db.flush()

        # ---------------------------------------------------------
        # 7. Create Invoice
        # ---------------------------------------------------------
        invoice = Invoice(
            business_id=current_user.business_id,
            order_id=order.id,
            invoice_number=generate_invoice_number(
                db,
                current_user.business_id,
            ),
        )

        db.add(invoice)

        # ---------------------------------------------------------
        # 8. Create Order Items
        # ---------------------------------------------------------
        order_items = []

        for item in calculated_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item["product"].id,
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                discount_amount=item["discount_amount"],
                tax_amount=item["tax_amount"],
                line_total=item["line_total"],
            )

            db.add(order_item)
            order_items.append(order_item)

        # ---------------------------------------------------------
        # 9. Create Payment
        # ---------------------------------------------------------
        payment_method = checkout_data.payment_method

        if hasattr(payment_method, "value"):
            payment_method = payment_method.value

        payment = Payment(
            order_id=order.id,
            business_id=current_user.business_id,
            method=payment_method,
            amount=total_amount,
            status="completed",
            reference=checkout_data.payment_reference,
        )

        db.add(payment)

        # ---------------------------------------------------------
        # 10. Create negative inventory SALE movements
        # ---------------------------------------------------------
        for item in calculated_items:
            movement = InventoryMovement(
                business_id=current_user.business_id,
                product_id=item["product"].id,
                movement_type="sale",
                quantity=-item["quantity"],
                reference=str(order.id),
                notes=f"Sale for order {order.id}",
                created_by=current_user.id,
            )

            db.add(movement)

        # ---------------------------------------------------------
        # 11. COMMIT EVERYTHING TOGETHER
        # ---------------------------------------------------------
        db.commit()

        db.refresh(order)
        db.refresh(invoice)
        db.refresh(payment)

        # ---------------------------------------------------------
        # 12. Clean API response
        # ---------------------------------------------------------
        return {
            "message": "Checkout completed successfully",
            "order_id": order.id,
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "subtotal": order.subtotal,
            "discount_amount": order.discount_amount,
            "tax_amount": order.tax_amount,
            "total_amount": order.total_amount,
            "payment": {
                "method": payment.method,
                "amount": payment.amount,
                "status": payment.status,
            },
            "items": [
                {
                    "product_id": item["product"].id,
                    "product_name": item["product"].name,
                    "quantity": item["quantity"],
                    "unit_price": item["unit_price"],
                    "discount_amount": item["discount_amount"],
                    "tax_amount": item["tax_amount"],
                    "line_total": item["line_total"],
                }
                for item in calculated_items
            ],
        }

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Checkout could not be completed",
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
