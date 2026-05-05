"""Add director metadata and results social feature tables."""

from alembic import op
import sqlalchemy as sa


revision = "20260504_0002"
down_revision = "20260430_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("movies", sa.Column("director_name", sa.String(), nullable=True))
    op.add_column("ratings", sa.Column("is_hidden", sa.Boolean(), nullable=True, server_default=sa.false()))

    op.create_table(
        "review_replies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("rating_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("parent_reply_id", sa.Integer(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("has_spoilers", sa.Boolean(), nullable=True),
        sa.Column("is_flagged", sa.Boolean(), nullable=True),
        sa.Column("is_approved", sa.Boolean(), nullable=True),
        sa.Column("is_hidden", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["parent_reply_id"], ["review_replies.id"]),
        sa.ForeignKeyConstraint(["rating_id"], ["ratings.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_review_replies_id"), "review_replies", ["id"], unique=False)
    op.create_index(op.f("ix_review_replies_parent_reply_id"), "review_replies", ["parent_reply_id"], unique=False)
    op.create_index(op.f("ix_review_replies_rating_id"), "review_replies", ["rating_id"], unique=False)

    op.create_table(
        "review_likes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rating_id", sa.Integer(), nullable=True),
        sa.Column("reply_id", sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "(rating_id IS NOT NULL AND reply_id IS NULL) OR (rating_id IS NULL AND reply_id IS NOT NULL)",
            name="ck_review_like_single_target",
        ),
        sa.ForeignKeyConstraint(["rating_id"], ["ratings.id"]),
        sa.ForeignKeyConstraint(["reply_id"], ["review_replies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "rating_id", name="uq_review_like_user_rating"),
        sa.UniqueConstraint("user_id", "reply_id", name="uq_review_like_user_reply"),
    )
    op.create_index(op.f("ix_review_likes_id"), "review_likes", ["id"], unique=False)
    op.create_index(op.f("ix_review_likes_rating_id"), "review_likes", ["rating_id"], unique=False)
    op.create_index(op.f("ix_review_likes_reply_id"), "review_likes", ["reply_id"], unique=False)

    op.create_table(
        "review_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rating_id", sa.Integer(), nullable=True),
        sa.Column("reply_id", sa.Integer(), nullable=True),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.CheckConstraint(
            "(rating_id IS NOT NULL AND reply_id IS NULL) OR (rating_id IS NULL AND reply_id IS NOT NULL)",
            name="ck_review_report_single_target",
        ),
        sa.ForeignKeyConstraint(["rating_id"], ["ratings.id"]),
        sa.ForeignKeyConstraint(["reply_id"], ["review_replies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "rating_id", name="uq_review_report_user_rating"),
        sa.UniqueConstraint("user_id", "reply_id", name="uq_review_report_user_reply"),
    )
    op.create_index(op.f("ix_review_reports_id"), "review_reports", ["id"], unique=False)
    op.create_index(op.f("ix_review_reports_rating_id"), "review_reports", ["rating_id"], unique=False)
    op.create_index(op.f("ix_review_reports_reply_id"), "review_reports", ["reply_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_review_reports_reply_id"), table_name="review_reports")
    op.drop_index(op.f("ix_review_reports_rating_id"), table_name="review_reports")
    op.drop_index(op.f("ix_review_reports_id"), table_name="review_reports")
    op.drop_table("review_reports")

    op.drop_index(op.f("ix_review_likes_reply_id"), table_name="review_likes")
    op.drop_index(op.f("ix_review_likes_rating_id"), table_name="review_likes")
    op.drop_index(op.f("ix_review_likes_id"), table_name="review_likes")
    op.drop_table("review_likes")

    op.drop_index(op.f("ix_review_replies_rating_id"), table_name="review_replies")
    op.drop_index(op.f("ix_review_replies_parent_reply_id"), table_name="review_replies")
    op.drop_index(op.f("ix_review_replies_id"), table_name="review_replies")
    op.drop_table("review_replies")

    op.drop_column("ratings", "is_hidden")
    op.drop_column("movies", "director_name")
