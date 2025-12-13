"""add_warranty_claim_description

Revision ID: add_warranty_desc
Revises: fix_services_cols
Create Date: 2025-12-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_warranty_desc'
down_revision = 'fix_services_cols'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Agregar columna warranty_claim_description a la tabla services."""
    op.add_column(
        'services',
        sa.Column(
            'warranty_claim_description',
            sa.Text(),
            nullable=True,
            comment='Descripción del problema (solo para servicios WARRANTY)'
        )
    )


def downgrade() -> None:
    """Revertir los cambios."""
    op.drop_column('services', 'warranty_claim_description')

