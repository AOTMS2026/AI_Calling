import os
import sys
import pytest
from dotenv import load_dotenv
from sqlmodel import Session

# Add Backend folder to path so we can import models and database configurations directly
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Backend"))
load_dotenv(os.path.join(backend_path, ".env"))

sys.path.insert(0, backend_path)

from app.database.connection import engine

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="session")
def base_url():
    return BASE_URL

@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session
