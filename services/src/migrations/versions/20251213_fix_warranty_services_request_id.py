"""fix_warranty_services_request_id

Revision ID: fix_warranty_reqid
Revises: add_warranty_desc
Create Date: 2025-12-13 13:00:00.000000

"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "fix_warranty_reqid"
down_revision = "add_warranty_desc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Evita duplicados en /service-requests: los services WARRANTY no deben usar request_id."""
    op.execute("UPDATE services SET request_id = NULL WHERE service_type = 'WARRANTY'")


def downgrade() -> None:
    """No es posible restaurar el request_id original de forma segura."""
    pass


