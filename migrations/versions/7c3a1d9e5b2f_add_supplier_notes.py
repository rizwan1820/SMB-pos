"""add supplier notes

Revision ID: 7c3a1d9e5b2f
Revises: 6b9d2f4a8c1e
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7c3a1d9e5b2f"
down_revision: Union[str, Sequence[str], None] = "6b9d2f4a8c1e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "suppliers",
        sa.Column("notes", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("suppliers", "notes")
