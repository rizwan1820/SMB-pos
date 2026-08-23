from uuid import UUID

from fastapi import APIRouter, Depends, Response

from app.auth.dependencies import get_current_user
from app.services import invoice_service


router = APIRouter()


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
