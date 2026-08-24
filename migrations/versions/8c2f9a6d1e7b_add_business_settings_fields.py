"""add business settings fields

Revision ID: 8c2f9a6d1e7b
Revises: 1d4e9b7c2a6f
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8c2f9a6d1e7b"
down_revision: Union[str, Sequence[str], None] = "1d4e9b7c2a6f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "businesses",
        sa.Column("logo_url", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "businesses",
        sa.Column("address", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "businesses",
        sa.Column("phone", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "businesses",
        sa.Column("email", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "businesses",
        sa.Column(
            "currency",
            sa.String(length=3),
            server_default="USD",
            nullable=False,
        ),
    )
    op.add_column(
        "businesses",
        sa.Column(
            "default_tax_rate",
            sa.Numeric(precision=5, scale=2),
            server_default="0",
            nullable=False,
        ),
    )
    op.add_column(
        "businesses",
        sa.Column(
            "tax_label",
            sa.String(length=50),
            server_default="Tax",
            nullable=False,
        ),
    )
    op.add_column(
        "businesses",
        sa.Column(
            "invoice_prefix",
            sa.String(length=20),
            server_default="INV",
            nullable=False,
        ),
    )
    op.add_column(
        "businesses",
        sa.Column(
            "invoice_business_name",
            sa.String(length=255),
            nullable=True,
        ),
    )
    op.add_column(
        "businesses",
        sa.Column("invoice_business_details", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("businesses", "invoice_business_details")
    op.drop_column("businesses", "invoice_business_name")
    op.drop_column("businesses", "invoice_prefix")
    op.drop_column("businesses", "tax_label")
    op.drop_column("businesses", "default_tax_rate")
    op.drop_column("businesses", "currency")
    op.drop_column("businesses", "email")
    op.drop_column("businesses", "phone")
    op.drop_column("businesses", "address")
    op.drop_column("businesses", "logo_url")
