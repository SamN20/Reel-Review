"""Add watch party reminder tracking

Revision ID: 20260607_0013
Revises: 20260607_0012
Create Date: 2026-06-07 19:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260607_0013"
down_revision = "20260607_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("watch_parties", sa.Column("reminder_sent_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_watch_parties_reminder_sent_at"), "watch_parties", ["reminder_sent_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_watch_parties_reminder_sent_at"), table_name="watch_parties")
    op.drop_column("watch_parties", "reminder_sent_at")
