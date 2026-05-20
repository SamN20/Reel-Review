"""Add roadmap item CTA fields

Revision ID: 20260518_0011
Revises: 20260518_0010
Create Date: 2026-05-18 20:18:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0011"
down_revision = "20260518_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("roadmap_items", sa.Column("cta_label", sa.String(length=80), nullable=True))
    op.add_column("roadmap_items", sa.Column("cta_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("roadmap_items", "cta_url")
    op.drop_column("roadmap_items", "cta_label")
