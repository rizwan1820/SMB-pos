from app.database.connection import SessionLocal
from app.models.business import Business
from app.models.profile import Profile
from app.models.role import Role
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError


def business_settings_response(business):
    return {
        "id": str(business.id),
        "name": business.name,
        "logo_url": business.logo_url,
        "address": business.address,
        "phone": business.phone,
        "email": business.email,
        "currency": business.currency,
        "default_tax_rate": business.default_tax_rate,
        "tax_label": business.tax_label,
        "invoice_prefix": business.invoice_prefix,
        "invoice_business_name": business.invoice_business_name,
        "invoice_business_details": business.invoice_business_details,
    }


def create_business(business):
    db = SessionLocal()

    try:
        new_business = Business(
            name=business.name
        )

        db.add(new_business)
        db.commit()
        db.refresh(new_business)

        return new_business

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid business data"
        )

    finally:
        db.close()


def business_response(business):
    return {
        "id": business.id,
        "name": business.name,
        "status": business.status,
        "logo_url": business.logo_url,
        "address": business.address,
        "phone": business.phone,
        "email": business.email,
        "currency": business.currency,
        "created_at": business.created_at,
        "updated_at": business.updated_at,
    }


def get_businesses():
    db = SessionLocal()

    try:
        businesses = (
            db.query(Business)
            .order_by(Business.created_at.desc())
            .all()
        )

        return [business_response(business) for business in businesses]

    finally:
        db.close()


def get_business(business_id):
    db = SessionLocal()

    try:
        business = db.get(Business, business_id)

        if not business:
            raise HTTPException(
                status_code=404,
                detail="Business not found"
            )

        return business_response(business)

    finally:
        db.close()


def update_business_status(business_id, status_update):
    db = SessionLocal()

    try:
        business = db.get(Business, business_id)

        if not business:
            raise HTTPException(
                status_code=404,
                detail="Business not found"
            )

        business.status = status_update.status

        db.commit()
        db.refresh(business)

        return business_response(business)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid business status"
        )

    finally:
        db.close()


def get_business_users(business_id):
    db = SessionLocal()

    try:
        business = db.get(Business, business_id)

        if not business:
            raise HTTPException(
                status_code=404,
                detail="Business not found"
            )

        users = (
            db.query(Profile, Role.name.label("role_name"))
            .join(Role, Role.id == Profile.role_id)
            .filter(
                Profile.business_id == business_id,
                Role.business_id == business_id,
            )
            .order_by(Profile.created_at.desc())
            .all()
        )

        return [
            {
                "id": profile.id,
                "name": profile.name,
                "email": None,
                "role_id": profile.role_id,
                "role": role_name,
                "status": profile.status,
                "is_platform_admin": profile.is_platform_admin,
                "created_at": profile.created_at,
            }
            for profile, role_name in users
        ]

    finally:
        db.close()


def get_business_settings(current_user):
    db = SessionLocal()

    try:
        business = db.get(Business, current_user.business_id)

        if not business:
            raise HTTPException(
                status_code=404,
                detail="Business not found"
            )

        return business_settings_response(business)

    finally:
        db.close()


def update_business_settings(settings, current_user):
    db = SessionLocal()

    try:
        business = (
            db.query(Business)
            .filter(Business.id == current_user.business_id)
            .first()
        )

        if not business:
            raise HTTPException(
                status_code=404,
                detail="Business not found"
            )

        updates = settings.model_dump(exclude_unset=True)

        for field, value in updates.items():
            setattr(business, field, value)

        db.commit()
        db.refresh(business)

        return business_settings_response(business)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid business settings"
        )

    finally:
        db.close()
