"""Add user privacy and display name fields

Revision ID: 857777b088ee
Revises: 20260509_0005
Create Date: 2026-05-12 04:10:35.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '857777b088ee'
down_revision = '20260509_0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('display_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('use_display_name', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('show_on_leaderboard', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('public_profile', sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'public_profile')
    op.drop_column('users', 'show_on_leaderboard')
    op.drop_column('users', 'use_display_name')
    op.drop_column('users', 'display_name')
