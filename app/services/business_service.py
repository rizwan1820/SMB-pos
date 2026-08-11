from app.database.connection import SessionLocal
from app.models.business import Business



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

    finally:
        db.close()