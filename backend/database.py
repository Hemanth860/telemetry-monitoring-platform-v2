"""
Database Configuration & Session Management
--------------------------------------------
Configures SQLite relational database connection using SQLAlchemy ORM.
Provides SessionLocal session factory and get_db FastAPI dependency.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./telemetry.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """
    Initializes SQLite database tables defined by SQLAlchemy ORM models.
    Safe to call on every startup — only creates tables that do not exist.
    """
    import models  # noqa: F401 – registers models with Base.metadata
    Base.metadata.create_all(bind=engine)


def get_db():
    """
    FastAPI Dependency providing database session for each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
