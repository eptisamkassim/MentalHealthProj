import os

# Must be set before any app module is imported, because database.py calls
# create_engine() at module load time using os.getenv("DATABASE_URL").
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("OPENAI_API_KEY", "test-key")

# SQLite doesn't accept postgres pool kwargs — strip them transparently so
# database.py can import cleanly even though we'll never actually use this engine.
import sqlalchemy as _sa
_orig_create_engine = _sa.create_engine

def _patched_create_engine(url, **kwargs):
    if "sqlite" in str(url):
        kwargs.pop("pool_size", None)
        kwargs.pop("max_overflow", None)
    return _orig_create_engine(url, **kwargs)

_sa.create_engine = _patched_create_engine

import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app


@pytest.fixture()
def mock_db():
    """A MagicMock db session whose queries return nothing by default."""
    session = MagicMock()
    # Direct filter chain (e.g. query().filter().first())
    session.query.return_value.filter.return_value.first.return_value = None
    session.query.return_value.filter.return_value.all.return_value = []
    return session


@pytest.fixture()
def client(mock_db):
    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
