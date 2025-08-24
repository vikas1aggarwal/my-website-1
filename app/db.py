from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Iterator
import os

from sqlmodel import Field, Relationship, SQLModel, Session, create_engine 

# Resolve a writable DB path inside the project
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Optional: allow override via env var APP_DB_PATH
db_path = Path(os.getenv("APP_DB_PATH", DATA_DIR / "app.db"))

_SQLITE_URL = f"sqlite:///{db_path}"
_engine = create_engine(_SQLITE_URL, echo=False, connect_args={"check_same_thread": False})

def get_engine():
    return _engine

def init_db() -> None:
    SQLModel.metadata.create_all(_engine)

@contextmanager
def get_session() -> Iterator[Session]:
    session = Session(_engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()