"""Add trailer YouTube key to movies."""

from alembic import op
import sqlalchemy as sa


revision = "20260508_0004"
down_revision = "20260504_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("movies", sa.Column("trailer_youtube_key", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("movies", "trailer_youtube_key")
