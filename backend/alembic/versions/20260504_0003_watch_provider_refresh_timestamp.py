"""Add watch provider refresh timestamp to movies."""

from alembic import op
import sqlalchemy as sa


revision = "20260504_0003"
down_revision = "20260504_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("movies", sa.Column("watch_providers_updated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("movies", "watch_providers_updated_at")
