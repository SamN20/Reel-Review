"""Add roadmap items and feature suggestions."""

from alembic import op
import sqlalchemy as sa


revision = "20260518_0010"
down_revision = "20260517_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "roadmap_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("source_suggestion_id", sa.Integer(), nullable=True),
        sa.Column("shipped_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_roadmap_items_id"), "roadmap_items", ["id"], unique=False)
    op.create_index(op.f("ix_roadmap_items_is_public"), "roadmap_items", ["is_public"], unique=False)
    op.create_index(op.f("ix_roadmap_items_sort_order"), "roadmap_items", ["sort_order"], unique=False)
    op.create_index(op.f("ix_roadmap_items_status"), "roadmap_items", ["status"], unique=False)

    op.create_table(
        "feature_suggestions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("promoted_item_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["promoted_item_id"], ["roadmap_items.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_feature_suggestions_id"), "feature_suggestions", ["id"], unique=False)
    op.create_index(op.f("ix_feature_suggestions_status"), "feature_suggestions", ["status"], unique=False)
    op.create_index(op.f("ix_feature_suggestions_user_id"), "feature_suggestions", ["user_id"], unique=False)

    op.create_foreign_key(
        "fk_roadmap_items_source_suggestion_id_feature_suggestions",
        "roadmap_items",
        "feature_suggestions",
        ["source_suggestion_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_roadmap_items_source_suggestion_id_feature_suggestions",
        "roadmap_items",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_feature_suggestions_user_id"), table_name="feature_suggestions")
    op.drop_index(op.f("ix_feature_suggestions_status"), table_name="feature_suggestions")
    op.drop_index(op.f("ix_feature_suggestions_id"), table_name="feature_suggestions")
    op.drop_table("feature_suggestions")
    op.drop_index(op.f("ix_roadmap_items_status"), table_name="roadmap_items")
    op.drop_index(op.f("ix_roadmap_items_sort_order"), table_name="roadmap_items")
    op.drop_index(op.f("ix_roadmap_items_is_public"), table_name="roadmap_items")
    op.drop_index(op.f("ix_roadmap_items_id"), table_name="roadmap_items")
    op.drop_table("roadmap_items")
