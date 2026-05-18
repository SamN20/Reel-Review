"""Refresh legacy-style invite codes."""

from __future__ import annotations

import secrets
import string

from alembic import op
import sqlalchemy as sa


revision = "20260517_0009"
down_revision = "20260517_0008"
branch_labels = None
depends_on = None

INVITE_CODE_LENGTH = 10
INVITE_CODE_ALPHABET = string.ascii_uppercase + string.digits


def generate_invite_code() -> str:
    return "".join(secrets.choice(INVITE_CODE_ALPHABET) for _ in range(INVITE_CODE_LENGTH))


def upgrade() -> None:
    connection = op.get_bind()
    legacy_users = connection.execute(
        sa.text("SELECT id FROM users WHERE upper(invite_code) LIKE 'LEGACY%'")
    ).fetchall()

    for row in legacy_users:
        while True:
            candidate = generate_invite_code()
            existing = connection.execute(
                sa.text("SELECT id FROM users WHERE invite_code = :invite_code"),
                {"invite_code": candidate},
            ).fetchone()
            if existing is None:
                connection.execute(
                    sa.text("UPDATE users SET invite_code = :invite_code WHERE id = :user_id"),
                    {"invite_code": candidate, "user_id": row.id},
                )
                break


def downgrade() -> None:
    pass
