from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.role import Role


def create_role(role, business_id):
    db = SessionLocal()

    try:
        new_role = Role(
            name=role.name,
            business_id=business_id
        )

        db.add(new_role)
        db.commit()
        db.refresh(new_role)

        return new_role

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid business or role data"
        )

    finally:
        db.close()


def get_roles_for_business(business_id):
    db = SessionLocal()

    try:
        return (
            db.query(Role)
            .filter(Role.business_id == business_id)
            .all()
        )

    finally:
        db.close()
