"""add reporting indexes

Revision ID: 1d4e9b7c2a6f
Revises: d2b114100ef4
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "1d4e9b7c2a6f"
down_revision: Union[str, Sequence[str], None] = "d2b114100ef4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        "ix_orders_business_status_created_at",
        "orders",
        ["business_id", "status", "created_at"],
    )
    op.create_index(
        "ix_payments_business_status_created_at",
        "payments",
        ["business_id", "status", "created_at"],
    )
    op.create_index(
        "ix_refunds_business_status_created_at",
        "refunds",
        ["business_id", "status", "created_at"],
    )
    op.create_index(
        "ix_returns_business_status_created_at",
        "returns",
        ["business_id", "status", "created_at"],
    )
    op.create_index(
        "ix_inventory_movements_business_product",
        "inventory_movements",
        ["business_id", "product_id"],
    )
    op.create_index(
        "ix_order_items_order_id",
        "order_items",
        ["order_id"],
    )
    op.create_index(
        "ix_order_items_product_id",
        "order_items",
        ["product_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_order_items_product_id", table_name="order_items")
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_index(
        "ix_inventory_movements_business_product",
        table_name="inventory_movements",
    )
    op.drop_index(
        "ix_returns_business_status_created_at",
        table_name="returns",
    )
    op.drop_index(
        "ix_refunds_business_status_created_at",
        table_name="refunds",
    )
    op.drop_index(
        "ix_payments_business_status_created_at",
        table_name="payments",
    )
    op.drop_index(
        "ix_orders_business_status_created_at",
        table_name="orders",
    )
