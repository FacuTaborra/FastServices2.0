"""fix_rehire_bidding_constraint

Revision ID: fix_bidding_constraint
Revises: fix_warranty_reqid
Create Date: 2025-12-13 19:15:00.000000

Corrige el CHECK CONSTRAINT para permitir RECONTRATACION con bidding_deadline NULL.
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'fix_bidding_constraint'
down_revision = 'fix_warranty_reqid'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Actualizar el constraint para incluir RECONTRATACION."""
    # Eliminar el constraint viejo
    op.drop_constraint('ck_service_requests_bidding_deadline', 'service_requests', type_='check')
    
    # Crear el constraint actualizado que incluye RECONTRATACION
    op.execute(
        """
        ALTER TABLE service_requests
        ADD CONSTRAINT ck_service_requests_bidding_deadline
        CHECK (
            (request_type = 'LICITACION' AND bidding_deadline IS NOT NULL)
            OR (request_type IN ('FAST', 'RECONTRATACION') AND bidding_deadline IS NULL)
        )
        """
    )


def downgrade() -> None:
    """Revertir al constraint original (solo FAST y LICITACION)."""
    op.drop_constraint('ck_service_requests_bidding_deadline', 'service_requests', type_='check')
    
    op.execute(
        """
        ALTER TABLE service_requests
        ADD CONSTRAINT ck_service_requests_bidding_deadline
        CHECK (
            (request_type = 'LICITACION' AND bidding_deadline IS NOT NULL)
            OR (request_type = 'FAST' AND bidding_deadline IS NULL)
        )
        """
    )

