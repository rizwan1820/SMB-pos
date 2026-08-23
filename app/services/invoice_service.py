from io import BytesIO
from uuid import UUID

from fastapi import HTTPException
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


def money_text(value):
    return f"${float(value):,.2f}"


def date_text(value):
    return value.strftime("%b %d, %Y")


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

    story.append(Paragraph(business["name"], styles["Title"]))
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
        ["Item", "Qty", "Unit Price", "Discount", "Tax", "Line Total"],
    ]

    for item in invoice_data["items"]:
        item_rows.append(
            [
                item["product_name"],
                str(item["quantity"]),
                money_text(item["unit_price"]),
                money_text(item["discount_amount"]),
                money_text(item["tax_amount"]),
                money_text(item["line_total"]),
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
            ["Subtotal", money_text(totals["subtotal"])],
            ["Discount Total", money_text(totals["discount_amount"])],
            ["Tax Total", money_text(totals["tax_amount"])],
            ["Final Total", money_text(totals["total_amount"])],
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
        ["Payment Amount", money_text(payment["amount"])],
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
