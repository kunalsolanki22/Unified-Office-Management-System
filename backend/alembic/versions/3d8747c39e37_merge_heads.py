"""merge heads

Revision ID: 3d8747c39e37
Revises: 106fda9a4b8c, 3d4f639d40d0
Create Date: 2026-02-25 14:55:23.440962

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3d8747c39e37'
down_revision: Union[str, None] = ('106fda9a4b8c', '3d4f639d40d0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
