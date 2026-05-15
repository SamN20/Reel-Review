"""Add drop selection options and ballots

Revision ID: 20260515_0007
Revises: 20260512_0006
Create Date: 2026-05-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260515_0007"
down_revision = "20260512_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("weekly_drops", sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "weekly_drop_options",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("weekly_drop_id", sa.Integer(), nullable=False),
        sa.Column("movie_id", sa.Integer(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("smart_score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["movie_id"], ["movies.id"]),
        sa.ForeignKeyConstraint(["weekly_drop_id"], ["weekly_drops.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("weekly_drop_id", "display_order", name="uq_weekly_drop_option_order"),
        sa.UniqueConstraint("weekly_drop_id", "movie_id", name="uq_weekly_drop_option_movie"),
    )
    op.create_index(op.f("ix_weekly_drop_options_id"), "weekly_drop_options", ["id"], unique=False)
    op.create_index(op.f("ix_weekly_drop_options_movie_id"), "weekly_drop_options", ["movie_id"], unique=False)
    op.create_index(op.f("ix_weekly_drop_options_weekly_drop_id"), "weekly_drop_options", ["weekly_drop_id"], unique=False)

    op.create_table(
        "weekly_drop_ballots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("weekly_drop_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("source_drop_id", sa.Integer(), nullable=True),
        sa.Column("ranked_movie_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["source_drop_id"], ["weekly_drops.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["weekly_drop_id"], ["weekly_drops.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("weekly_drop_id", "user_id", name="uq_weekly_drop_ballot_user"),
    )
    op.create_index(op.f("ix_weekly_drop_ballots_id"), "weekly_drop_ballots", ["id"], unique=False)
    op.create_index(op.f("ix_weekly_drop_ballots_source_drop_id"), "weekly_drop_ballots", ["source_drop_id"], unique=False)
    op.create_index(op.f("ix_weekly_drop_ballots_user_id"), "weekly_drop_ballots", ["user_id"], unique=False)
    op.create_index(op.f("ix_weekly_drop_ballots_weekly_drop_id"), "weekly_drop_ballots", ["weekly_drop_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_weekly_drop_ballots_weekly_drop_id"), table_name="weekly_drop_ballots")
    op.drop_index(op.f("ix_weekly_drop_ballots_user_id"), table_name="weekly_drop_ballots")
    op.drop_index(op.f("ix_weekly_drop_ballots_source_drop_id"), table_name="weekly_drop_ballots")
    op.drop_index(op.f("ix_weekly_drop_ballots_id"), table_name="weekly_drop_ballots")
    op.drop_table("weekly_drop_ballots")
    op.drop_index(op.f("ix_weekly_drop_options_weekly_drop_id"), table_name="weekly_drop_options")
    op.drop_index(op.f("ix_weekly_drop_options_movie_id"), table_name="weekly_drop_options")
    op.drop_index(op.f("ix_weekly_drop_options_id"), table_name="weekly_drop_options")
    op.drop_table("weekly_drop_options")
    op.drop_column("weekly_drops", "resolved_at")
