import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "Backend"))

from sqlmodel import SQLModel
from app.database.connection import engine
from app.models import domain

print("Creating new tables (if they don't exist)...")
SQLModel.metadata.create_all(engine)
print("Schema update complete.")
