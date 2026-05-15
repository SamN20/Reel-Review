"""Add admin settings table

Revision ID: 20260512_0006
Revises: 857777b088ee
Create Date: 2026-05-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260512_0006"
down_revision = "857777b088ee"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admin_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_admin_settings_id", "admin_settings", ["id"], unique=False)
    op.create_index("ix_admin_settings_key", "admin_settings", ["key"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_admin_settings_key", table_name="admin_settings")
    op.drop_index("ix_admin_settings_id", table_name="admin_settings")
    op.drop_table("admin_settings")
