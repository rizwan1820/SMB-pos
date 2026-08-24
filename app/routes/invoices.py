from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response

from app.auth.dependencies import get_current_user
from app.services import invoice_service


router = APIRouter()


@router.get("/invoices")
def get_invoices(
    search: str | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user=Depends(get_current_user),
):
    return invoice_service.get_invoices(
        current_user=current_user,
        search=search,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/invoices/{invoice_id}")
def get_invoice(
    invoice_id: UUID,
    current_user=Depends(get_current_user),
):
    return invoice_service.get_invoice(
        invoice_id,
        current_user,
    )


@router.get("/invoices/{invoice_id}/pdf")
def get_invoice_pdf(
    invoice_id: UUID,
    current_user=Depends(get_current_user),
):
    invoice_data, pdf_bytes = invoice_service.generate_invoice_pdf(
        invoice_id,
        current_user,
    )
    invoice_number = invoice_data["invoice"]["invoice_number"]

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{invoice_number}.pdf"'
            ),
        },
    )
