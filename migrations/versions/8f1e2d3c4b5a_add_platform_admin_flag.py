"""add platform admin flag

Revision ID: 8f1e2d3c4b5a
Revises: 7c3a1d9e5b2f
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8f1e2d3c4b5a"
down_revision: Union[str, Sequence[str], None] = "7c3a1d9e5b2f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "profiles",
        sa.Column(
            "is_platform_admin",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_profiles_business_status",
        "profiles",
        ["business_id", "status"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_profiles_business_status", table_name="profiles")
    op.drop_column("profiles", "is_platform_admin")
