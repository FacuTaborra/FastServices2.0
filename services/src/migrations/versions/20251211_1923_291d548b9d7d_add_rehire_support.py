"""add_rehire_support

Revision ID: 291d548b9d7d
Revises: b43a261710e5
Create Date: 2025-12-11 19:23:05.459891

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '291d548b9d7d'
down_revision = 'b43a261710e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Aplicar los cambios de la migración."""
    # Agregar RECONTRATACION al enum request_type (Alembic no lo detecta automáticamente)
    op.execute(
        "ALTER TABLE service_requests "
        "MODIFY COLUMN request_type ENUM('FAST', 'LICITACION', 'RECONTRATACION') NOT NULL DEFAULT 'FAST'"
    )


def downgrade() -> None:
    """Revertir los cambios de la migración."""
    # Quitar RECONTRATACION del enum (primero hay que borrar las filas con ese valor)
    op.execute(
        "DELETE FROM service_requests WHERE request_type = 'RECONTRATACION'"
    )
    op.execute(
        "ALTER TABLE service_requests "
        "MODIFY COLUMN request_type ENUM('FAST', 'LICITACION') NOT NULL DEFAULT 'FAST'"
    )