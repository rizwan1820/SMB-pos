from app.database.connection import SessionLocal
from app.models.role import Role


def create_role(role):
    db = SessionLocal()

    try:
        new_role = Role(
            name=role.name,
            business_id=role.business_id
        )

        db.add(new_role)
        db.commit()
        db.refresh(new_role)

        return new_role

    finally:
        db.close()
