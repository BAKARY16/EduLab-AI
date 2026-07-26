from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from .config import get_settings


engine = create_engine(
    get_settings().database_url,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"},
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
