from datetime import date

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.schemas.report import ReportRange
from app.services import report_service


router = APIRouter()


@router.get("/reports/dashboard")
def get_dashboard_report(
    range: ReportRange = Query(default=ReportRange.today),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user=Depends(get_current_user),
):
    return report_service.get_dashboard(
        range,
        start_date,
        end_date,
        current_user,
    )


@router.get("/reports/sales")
def get_sales_report(
    range: ReportRange = Query(default=ReportRange.today),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user=Depends(get_current_user),
):
    return report_service.get_sales_report(
        range,
        start_date,
        end_date,
        current_user,
    )


@router.get("/reports/products")
def get_products_report(
    range: ReportRange = Query(default=ReportRange.today),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user=Depends(get_current_user),
):
    return report_service.get_products_report(
        range,
        start_date,
        end_date,
        current_user,
    )


@router.get("/reports/customers")
def get_customers_report(
    range: ReportRange = Query(default=ReportRange.today),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user=Depends(get_current_user),
):
    return report_service.get_customers_report(
        range,
        start_date,
        end_date,
        current_user,
    )


@router.get("/reports/returns")
def get_returns_report(
    range: ReportRange = Query(default=ReportRange.today),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user=Depends(get_current_user),
):
    return report_service.get_returns_report(
        range,
        start_date,
        end_date,
        current_user,
    )
