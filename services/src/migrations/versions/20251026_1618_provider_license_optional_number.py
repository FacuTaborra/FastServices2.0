"""make provider license number optional

Revision ID: 20251026_1618
Revises: a4a15f767384
Create Date: 2025-10-26 16:18:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251026_1618"
down_revision = "a4a15f767384"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "provider_licenses",
        "license_number",
        existing_type=sa.String(length=120),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "provider_licenses",
        "license_number",
        existing_type=sa.String(length=120),
        nullable=False,
    )
