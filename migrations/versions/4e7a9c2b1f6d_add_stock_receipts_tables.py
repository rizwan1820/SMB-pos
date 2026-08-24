"""add stock receipts tables

Revision ID: 4e7a9c2b1f6d
Revises: 8c2f9a6d1e7b
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4e7a9c2b1f6d"
down_revision: Union[str, Sequence[str], None] = "8c2f9a6d1e7b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "stock_receipts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("business_id", sa.UUID(), nullable=False),
        sa.Column("supplier_id", sa.UUID(), nullable=False),
        sa.Column("receipt_date", sa.Date(), nullable=False),
        sa.Column("reference", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("total_cost", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column(
            "status",
            sa.String(length=50),
            server_default="completed",
            nullable=False,
        ),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["profiles.id"]),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_stock_receipts_business_receipt_date",
        "stock_receipts",
        ["business_id", "receipt_date"],
    )
    op.create_index(
        "ix_stock_receipts_business_supplier",
        "stock_receipts",
        ["business_id", "supplier_id"],
    )

    op.create_table(
        "stock_receipt_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("stock_receipt_id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=14, scale=3), nullable=False),
        sa.Column("unit_cost", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("line_total", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["stock_receipt_id"], ["stock_receipts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_stock_receipt_items_stock_receipt_id",
        "stock_receipt_items",
        ["stock_receipt_id"],
    )
    op.create_index(
        "ix_stock_receipt_items_product_id",
        "stock_receipt_items",
        ["product_id"],
    )

    op.add_column(
        "inventory_movements",
        sa.Column("stock_receipt_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "inventory_movements",
        sa.Column("stock_receipt_item_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_inventory_movements_stock_receipt_id",
        "inventory_movements",
        "stock_receipts",
        ["stock_receipt_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_inventory_movements_stock_receipt_item_id",
        "inventory_movements",
        "stock_receipt_items",
        ["stock_receipt_item_id"],
        ["id"],
    )
    op.create_index(
        "ix_inventory_movements_stock_receipt_id",
        "inventory_movements",
        ["stock_receipt_id"],
    )
    op.create_index(
        "ix_inventory_movements_stock_receipt_item_id",
        "inventory_movements",
        ["stock_receipt_item_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "ix_inventory_movements_stock_receipt_item_id",
        table_name="inventory_movements",
    )
    op.drop_index(
        "ix_inventory_movements_stock_receipt_id",
        table_name="inventory_movements",
    )
    op.drop_constraint(
        "fk_inventory_movements_stock_receipt_item_id",
        "inventory_movements",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_inventory_movements_stock_receipt_id",
        "inventory_movements",
        type_="foreignkey",
    )
    op.drop_column("inventory_movements", "stock_receipt_item_id")
    op.drop_column("inventory_movements", "stock_receipt_id")

    op.drop_index(
        "ix_stock_receipt_items_product_id",
        table_name="stock_receipt_items",
    )
    op.drop_index(
        "ix_stock_receipt_items_stock_receipt_id",
        table_name="stock_receipt_items",
    )
    op.drop_table("stock_receipt_items")

    op.drop_index(
        "ix_stock_receipts_business_supplier",
        table_name="stock_receipts",
    )
    op.drop_index(
        "ix_stock_receipts_business_receipt_date",
        table_name="stock_receipts",
    )
    op.drop_table("stock_receipts")
