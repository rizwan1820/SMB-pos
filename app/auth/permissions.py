from fastapi import Depends, HTTPException
from sqlalchemy import select

from app.auth.dependencies import get_current_user
from app.database.connection import SessionLocal
from app.models.permission import Permission
from app.models.role_permission import RolePermission


def require_permission(permission_name: str):

    def permission_checker(current_user=Depends(get_current_user)):
        db = SessionLocal()

        try:
            statement = (
                select(Permission)
                .join(
                    RolePermission,
                    RolePermission.permission_id == Permission.id
                )
                .where(
                    RolePermission.role_id == current_user.role_id,
                    Permission.name == permission_name
                )
            )

            permission = db.execute(statement).scalar_one_or_none()

            if permission is None:
                raise HTTPException(
                    status_code=403,
                    detail="Permission denied"
                )

            return current_user

        finally:
            db.close()

    return permission_checker