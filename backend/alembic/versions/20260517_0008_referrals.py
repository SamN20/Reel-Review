"""Add referral invite fields to users."""

from alembic import op
import sqlalchemy as sa


revision = "20260517_0008"
down_revision = "20260515_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("invite_code", sa.String(), nullable=True))
    op.add_column("users", sa.Column("referred_by_user_id", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("referral_attributed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_users_invite_code"), "users", ["invite_code"], unique=True)
    op.create_foreign_key(
        "fk_users_referred_by_user_id_users",
        "users",
        "users",
        ["referred_by_user_id"],
        ["id"],
    )

    connection = op.get_bind()
    users = connection.execute(sa.text("SELECT id FROM users")).fetchall()
    for row in users:
        invite_code = f"LEGACY{int(row.id):04d}"
        connection.execute(
            sa.text("UPDATE users SET invite_code = :invite_code WHERE id = :user_id"),
            {"invite_code": invite_code, "user_id": row.id},
        )

    op.alter_column("users", "invite_code", existing_type=sa.String(), nullable=False)


def downgrade() -> None:
    op.drop_constraint("fk_users_referred_by_user_id_users", "users", type_="foreignkey")
    op.drop_index(op.f("ix_users_invite_code"), table_name="users")
    op.drop_column("users", "referral_attributed_at")
    op.drop_column("users", "referred_by_user_id")
    op.drop_column("users", "invite_code")
