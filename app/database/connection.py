import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url


load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from .env")

database_url = make_url(DATABASE_URL)

if database_url.drivername in {"postgres", "postgresql", "postgresql+psycopg2"}:
    database_url = database_url.set(drivername="postgresql+psycopg")

engine = create_engine(
    database_url,
    connect_args={"sslmode": "require"},
    pool_pre_ping=True,
)


def test_connection() -> int:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar()
