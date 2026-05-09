"""Add movie request queue."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260509_0005"
down_revision = "20260508_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "movie_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tmdb_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("movie_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("release_date", sa.String(), nullable=True),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("poster_path", sa.String(), nullable=True),
        sa.Column("backdrop_path", sa.String(), nullable=True),
        sa.Column("genres", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("admin_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["movie_id"], ["movies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_movie_requests_id"), "movie_requests", ["id"], unique=False)
    op.create_index(op.f("ix_movie_requests_status"), "movie_requests", ["status"], unique=False)
    op.create_index(op.f("ix_movie_requests_tmdb_id"), "movie_requests", ["tmdb_id"], unique=True)

    op.create_table(
        "movie_request_supporters",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["request_id"], ["movie_requests.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_id", "user_id", name="uq_movie_request_supporter"),
    )
    op.create_index(op.f("ix_movie_request_supporters_id"), "movie_request_supporters", ["id"], unique=False)
    op.create_index(op.f("ix_movie_request_supporters_request_id"), "movie_request_supporters", ["request_id"], unique=False)
    op.create_index(op.f("ix_movie_request_supporters_user_id"), "movie_request_supporters", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_movie_request_supporters_user_id"), table_name="movie_request_supporters")
    op.drop_index(op.f("ix_movie_request_supporters_request_id"), table_name="movie_request_supporters")
    op.drop_index(op.f("ix_movie_request_supporters_id"), table_name="movie_request_supporters")
    op.drop_table("movie_request_supporters")
    op.drop_index(op.f("ix_movie_requests_tmdb_id"), table_name="movie_requests")
    op.drop_index(op.f("ix_movie_requests_status"), table_name="movie_requests")
    op.drop_index(op.f("ix_movie_requests_id"), table_name="movie_requests")
    op.drop_table("movie_requests")
