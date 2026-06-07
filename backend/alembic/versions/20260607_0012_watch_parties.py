"""Add watch party tables

Revision ID: 20260607_0012
Revises: 20260518_0011
Create Date: 2026-06-07 18:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260607_0012"
down_revision = "20260518_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "watch_parties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("weekly_drop_id", sa.Integer(), nullable=False),
        sa.Column("creator_user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("host_mode", sa.String(length=32), nullable=False),
        sa.Column("external_url", sa.String(length=500), nullable=True),
        sa.Column("discord_channel_key", sa.String(length=64), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("timezone_label", sa.String(length=80), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=True),
        sa.Column("platform", sa.String(length=120), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("visibility_hint", sa.String(length=32), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["weekly_drop_id"], ["weekly_drops.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_watch_parties_creator_user_id"), "watch_parties", ["creator_user_id"], unique=False)
    op.create_index(op.f("ix_watch_parties_id"), "watch_parties", ["id"], unique=False)
    op.create_index(op.f("ix_watch_parties_scheduled_for"), "watch_parties", ["scheduled_for"], unique=False)
    op.create_index(op.f("ix_watch_parties_status"), "watch_parties", ["status"], unique=False)
    op.create_index(op.f("ix_watch_parties_weekly_drop_id"), "watch_parties", ["weekly_drop_id"], unique=False)

    op.create_table(
        "watch_party_rsvps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("watch_party_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["watch_party_id"], ["watch_parties.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("watch_party_id", "user_id", name="uq_watch_party_rsvp_user"),
    )
    op.create_index(op.f("ix_watch_party_rsvps_id"), "watch_party_rsvps", ["id"], unique=False)
    op.create_index(op.f("ix_watch_party_rsvps_user_id"), "watch_party_rsvps", ["user_id"], unique=False)
    op.create_index(op.f("ix_watch_party_rsvps_watch_party_id"), "watch_party_rsvps", ["watch_party_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_watch_party_rsvps_watch_party_id"), table_name="watch_party_rsvps")
    op.drop_index(op.f("ix_watch_party_rsvps_user_id"), table_name="watch_party_rsvps")
    op.drop_index(op.f("ix_watch_party_rsvps_id"), table_name="watch_party_rsvps")
    op.drop_table("watch_party_rsvps")

    op.drop_index(op.f("ix_watch_parties_weekly_drop_id"), table_name="watch_parties")
    op.drop_index(op.f("ix_watch_parties_status"), table_name="watch_parties")
    op.drop_index(op.f("ix_watch_parties_scheduled_for"), table_name="watch_parties")
    op.drop_index(op.f("ix_watch_parties_id"), table_name="watch_parties")
    op.drop_index(op.f("ix_watch_parties_creator_user_id"), table_name="watch_parties")
    op.drop_table("watch_parties")
