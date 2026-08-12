from app.database.connection import SessionLocal
from app.models.business import Business
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError


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
