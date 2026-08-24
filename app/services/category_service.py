from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.database.connection import SessionLocal
from app.models.category import Category


def create_category(category, business_id):
    db = SessionLocal()

    try:
        new_category = Category(
            name=category.name,
            business_id=business_id
        )

        db.add(new_category)
        db.commit()
        db.refresh(new_category)

        return new_category

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid business or category data"
        )

    finally:
        db.close()

def get_categories_for_business(business_id):
    db = SessionLocal()

    try:
        categories = (
            db.query(Category)
            .filter(Category.business_id == business_id)
            .all()
        )

        return categories

    finally:
        db.close()


def update_category(category_id, category_update, business_id):
    db = SessionLocal()

    try:
        category = (
            db.query(Category)
            .filter(
                Category.id == category_id,
                Category.business_id == business_id
            )
            .first()
        )

        if not category:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )

        category.name = category_update.name

        db.commit()
        db.refresh(category)

        return category

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid category data"
        )

    finally:
        db.close()


def archive_category(category_id, business_id):
    db = SessionLocal()

    try:
        category = (
            db.query(Category)
            .filter(
                Category.id == category_id,
                Category.business_id == business_id
            )
            .first()
        )

        if not category:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )

        category.status = "archived"

        db.commit()
        db.refresh(category)

        return category

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Invalid category data"
        )

    finally:
        db.close()
