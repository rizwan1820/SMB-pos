"""add customer crm fields

Revision ID: 6b9d2f4a8c1e
Revises: 4e7a9c2b1f6d
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6b9d2f4a8c1e"
down_revision: Union[str, Sequence[str], None] = "4e7a9c2b1f6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "customers",
        sa.Column(
            "customer_type",
            sa.String(length=50),
            server_default="individual",
            nullable=False,
        ),
    )
    op.add_column(
        "customers",
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index(
        "ix_orders_business_customer_status_created_at",
        "orders",
        ["business_id", "customer_id", "status", "created_at"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "ix_orders_business_customer_status_created_at",
        table_name="orders",
    )
    op.drop_column("customers", "notes")
    op.drop_column("customers", "customer_type")
