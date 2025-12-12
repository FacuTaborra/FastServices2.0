"""fix_services_columns

Revision ID: fix_services_cols
Revises: 291d548b9d7d
Create Date: 2025-12-12 08:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fix_services_cols'
down_revision = '291d548b9d7d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Agregar columnas faltantes a la tabla services."""
    # Columnas para servicios de garantía/mantenimiento
    op.add_column('services', sa.Column('parent_service_id', sa.BigInteger(), nullable=True))
    op.add_column('services', sa.Column('service_type', sa.String(20), nullable=False, server_default='ORIGINAL'))
    op.add_column('services', sa.Column('warranty_days', sa.SmallInteger(), nullable=False, server_default='30'))
    op.add_column('services', sa.Column('warranty_expires_at', sa.DateTime(), nullable=True))
    
    # Foreign key para parent_service_id
    op.create_foreign_key(
        'fk_services_parent_service',
        'services',
        'services',
        ['parent_service_id'],
        ['id'],
        ondelete='SET NULL'
    )
    
    # Índice para parent_service_id
    op.create_index('ix_services_parent_service_id', 'services', ['parent_service_id'])


def downgrade() -> None:
    """Revertir los cambios."""
    op.drop_index('ix_services_parent_service_id', table_name='services')
    op.drop_constraint('fk_services_parent_service', 'services', type_='foreignkey')
    op.drop_column('services', 'warranty_expires_at')
    op.drop_column('services', 'warranty_days')
    op.drop_column('services', 'service_type')
    op.drop_column('services', 'parent_service_id')



