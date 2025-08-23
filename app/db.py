from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlmodel import SQLModel, Session, create_engine

_SQLITE_URL = "sqlite:////workspace/app/data/app.db"
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