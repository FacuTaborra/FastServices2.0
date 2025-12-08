"""migrate ARG currency to ARS

Revision ID: a1b2c3d4e5f6
Revises: 0d09cbd6e34d
Create Date: 2025-12-08 12:30:00.000000

"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "0d09cbd6e34d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Migrar código de moneda ARG a ARS (código ISO correcto)."""

    # 1. Crear la nueva moneda ARS si no existe
    op.execute("""
        INSERT INTO currencies (code, name) 
        VALUES ('ARS', 'Peso Argentino')
        ON DUPLICATE KEY UPDATE name = 'Peso Argentino'
    """)

    # 2. Migrar todas las propuestas de ARG a ARS
    op.execute("""
        UPDATE service_request_proposals 
        SET currency = 'ARS' 
        WHERE currency = 'ARG'
    """)

    # 3. Migrar todos los servicios de ARG a ARS
    op.execute("""
        UPDATE services 
        SET currency = 'ARS' 
        WHERE currency = 'ARG'
    """)

    # 4. Eliminar la moneda ARG vieja
    op.execute("""
        DELETE FROM currencies WHERE code = 'ARG'
    """)


def downgrade() -> None:
    """Revertir: volver de ARS a ARG."""

    # 1. Crear la moneda ARG
    op.execute("""
        INSERT INTO currencies (code, name) 
        VALUES ('ARG', 'Pesos Argentinos')
        ON DUPLICATE KEY UPDATE name = 'Pesos Argentinos'
    """)

    # 2. Migrar propuestas de ARS a ARG
    op.execute("""
        UPDATE service_request_proposals 
        SET currency = 'ARG' 
        WHERE currency = 'ARS'
    """)

    # 3. Migrar servicios de ARS a ARG
    op.execute("""
        UPDATE services 
        SET currency = 'ARG' 
        WHERE currency = 'ARS'
    """)

    # 4. Eliminar ARS
    op.execute("""
        DELETE FROM currencies WHERE code = 'ARS'
    """)
