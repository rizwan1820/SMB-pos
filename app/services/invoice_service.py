from io import BytesIO
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID
from xml.sax.saxutils import escape

from fastapi import HTTPException
from sqlalchemy import String, and_, cast, or_
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.database.connection import SessionLocal
from app.models.business import Business
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.product import Product


def money_text(value, currency="USD"):
    return f"{currency} {float(value):,.2f}"


def date_text(value):
    return value.strftime("%b %d, %Y")


def _day_start(value: date):
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def get_invoices(
    current_user,
    search: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date",
        )

    db = SessionLocal()

    try:
        query = (
            db.query(
                Invoice.id,
                Invoice.invoice_number,
                Invoice.invoice_date,
                Invoice.order_id,
                Customer.name.label("customer_name"),
                Order.total_amount,
                Payment.method.label("payment_method"),
                Payment.status.label("payment_status"),
            )
            .join(
                Order,
                and_(
                    Order.id == Invoice.order_id,
                    Order.business_id == current_user.business_id,
                ),
            )
            .outerjoin(
                Customer,
                and_(
                    Customer.id == Order.customer_id,
                    Customer.business_id == current_user.business_id,
                ),
            )
            .outerjoin(
                Payment,
                and_(
                    Payment.order_id == Order.id,
                    Payment.business_id == current_user.business_id,
                ),
            )
            .filter(Invoice.business_id == current_user.business_id)
        )

        if start_date:
            query = query.filter(Invoice.invoice_date >= _day_start(start_date))

        if end_date:
            query = query.filter(
                Invoice.invoice_date < _day_start(end_date + timedelta(days=1))
            )

        if search:
            search_value = search.strip()

            if search_value:
                pattern = f"%{search_value}%"
                query = query.filter(
                    or_(
                        Invoice.invoice_number.ilike(pattern),
                        cast(Invoice.order_id, String).ilike(pattern),
                        Customer.name.ilike(pattern),
                    )
                )

        invoices = query.order_by(Invoice.invoice_date.desc()).all()

        return [
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "invoice_date": invoice.invoice_date,
                "order_id": invoice.order_id,
                "customer_name": invoice.customer_name,
                "total_amount": invoice.total_amount,
                "payment_method": invoice.payment_method,
                "payment_status": invoice.payment_status,
            }
            for invoice in invoices
        ]

    finally:
        db.close()


def get_invoice(invoice_id: UUID, current_user):
    db = SessionLocal()

    try:
        invoice = (
            db.query(Invoice)
            .filter(
                Invoice.id == invoice_id,
                Invoice.business_id == current_user.business_id,
            )
            .first()
        )

        if not invoice:
            raise HTTPException(
                status_code=404,
                detail="Invoice not found",
            )

        order = (
            db.query(Order)
            .filter(
                Order.id == invoice.order_id,
                Order.business_id == current_user.business_id,
            )
            .first()
        )

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Invoice order not found",
            )

        business = (
            db.query(Business)
            .filter(Business.id == current_user.business_id)
            .first()
        )

        if not business:
            raise HTTPException(
                status_code=404,
                detail="Business not found",
            )

        customer = None

        if order.customer_id:
            customer = (
                db.query(Customer)
                .filter(
                    Customer.id == order.customer_id,
                    Customer.business_id == current_user.business_id,
                )
                .first()
            )

            if not customer:
                raise HTTPException(
                    status_code=404,
                    detail="Invoice customer not found",
                )

        order_items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order.id)
            .all()
        )

        product_ids = [item.product_id for item in order_items]

        products = (
            db.query(Product)
            .filter(
                Product.id.in_(product_ids),
                Product.business_id == current_user.business_id,
            )
            .all()
            if product_ids
            else []
        )

        product_name_by_id = {
            product.id: product.name
            for product in products
        }

        payment = (
            db.query(Payment)
            .filter(
                Payment.order_id == order.id,
                Payment.business_id == current_user.business_id,
            )
            .first()
        )

        if not payment:
            raise HTTPException(
                status_code=404,
                detail="Invoice payment not found",
            )

        return {
            "invoice": {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "invoice_date": invoice.invoice_date,
            },
            "business": {
                "name": business.name,
                "logo_url": business.logo_url,
                "address": business.address,
                "phone": business.phone,
                "email": business.email,
                "currency": business.currency,
                "tax_label": business.tax_label,
                "invoice_business_name": business.invoice_business_name,
                "invoice_business_details": (
                    business.invoice_business_details
                ),
            },
            "customer": (
                {
                    "id": customer.id,
                    "name": customer.name,
                    "phone": customer.phone,
                    "email": customer.email,
                    "address": customer.address,
                }
                if customer
                else None
            ),
            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": (
                        product_name_by_id.get(item.product_id)
                        or "Product"
                    ),
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "discount_amount": item.discount_amount,
                    "tax_amount": item.tax_amount,
                    "line_total": item.line_total,
                }
                for item in order_items
            ],
            "totals": {
                "subtotal": order.subtotal,
                "discount_amount": order.discount_amount,
                "tax_amount": order.tax_amount,
                "total_amount": order.total_amount,
            },
            "payment": {
                "method": payment.method,
                "amount": payment.amount,
                "status": payment.status,
                "reference": payment.reference,
            },
        }

    finally:
        db.close()


def generate_invoice_pdf(invoice_id: UUID, current_user):
    invoice_data = get_invoice(invoice_id, current_user)
    buffer = BytesIO()
    styles = getSampleStyleSheet()

    document = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    story = []
    invoice = invoice_data["invoice"]
    business = invoice_data["business"]
    customer = invoice_data["customer"]
    payment = invoice_data["payment"]
    totals = invoice_data["totals"]
    currency = business.get("currency") or "USD"
    tax_label = business.get("tax_label") or "Tax"
    business_name = (
        business.get("invoice_business_name")
        or business.get("name")
        or "Business"
    )

    story.append(Paragraph(escape(business_name), styles["Title"]))

    business_lines = []

    for field in ["address", "phone", "email"]:
        if business.get(field):
            business_lines.append(escape(business[field]))

    if business.get("invoice_business_details"):
        detail_lines = [
            escape(line.strip())
            for line in business["invoice_business_details"].splitlines()
            if line.strip()
        ]
        business_lines.extend(detail_lines)

    if business_lines:
        story.append(
            Paragraph("<br/>".join(business_lines), styles["BodyText"])
        )

    story.append(Paragraph("Invoice", styles["Heading2"]))
    story.append(Spacer(1, 0.15 * inch))

    header_table = Table(
        [
            ["Invoice Number", invoice["invoice_number"]],
            ["Invoice Date", date_text(invoice["invoice_date"])],
        ],
        colWidths=[1.5 * inch, 4.5 * inch],
    )
    header_table.setStyle(
        TableStyle(
            [
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#666666")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 0.2 * inch))

    customer_lines = ["Walk-in Customer"]

    if customer:
        customer_lines = [customer["name"]]

        for field in ["phone", "email", "address"]:
            if customer[field]:
                customer_lines.append(customer[field])

    story.append(Paragraph("Bill To", styles["Heading3"]))
    story.append(Paragraph("<br/>".join(customer_lines), styles["BodyText"]))
    story.append(Spacer(1, 0.25 * inch))

    item_rows = [
        ["Item", "Qty", "Unit Price", "Discount", tax_label, "Line Total"],
    ]

    for item in invoice_data["items"]:
        item_rows.append(
            [
                item["product_name"],
                str(item["quantity"]),
                money_text(item["unit_price"], currency),
                money_text(item["discount_amount"], currency),
                money_text(item["tax_amount"], currency),
                money_text(item["line_total"], currency),
            ]
        )

    item_table = Table(
        item_rows,
        colWidths=[
            2.2 * inch,
            0.55 * inch,
            1.0 * inch,
            0.9 * inch,
            0.8 * inch,
            1.05 * inch,
        ],
        repeatRows=1,
    )
    item_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f1f1")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(item_table)
    story.append(Spacer(1, 0.25 * inch))

    totals_table = Table(
        [
            ["Subtotal", money_text(totals["subtotal"], currency)],
            [
                "Discount Total",
                money_text(totals["discount_amount"], currency),
            ],
            [f"{tax_label} Total", money_text(totals["tax_amount"], currency)],
            ["Final Total", money_text(totals["total_amount"], currency)],
        ],
        colWidths=[4.8 * inch, 1.7 * inch],
    )
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("LINEABOVE", (0, -1), (-1, -1), 0.75, colors.black),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(totals_table)
    story.append(Spacer(1, 0.25 * inch))

    payment_rows = [
        ["Payment Method", payment["method"].title()],
        ["Payment Amount", money_text(payment["amount"], currency)],
        ["Payment Status", payment["status"].title()],
    ]

    if payment["reference"]:
        payment_rows.append(["Payment Reference", payment["reference"]])

    payment_table = Table(
        payment_rows,
        colWidths=[1.7 * inch, 4.8 * inch],
    )
    payment_table.setStyle(
        TableStyle(
            [
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#666666")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(Paragraph("Payment", styles["Heading3"]))
    story.append(payment_table)

    document.build(story)
    buffer.seek(0)

    return invoice_data, buffer.getvalue()
