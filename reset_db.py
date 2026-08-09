import os
import sys

# Add the Backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "Backend"))

from sqlmodel import SQLModel
from app.database.connection import engine
from app.models import domain
from app.models.models_todo import Todo, TodoActivity
from app.models.models_whatsapp import WhatsAppCampaign, WhatsAppMessage, WhatsAppTemplate, WhatsAppGroup, WhatsAppImportLog

print("Dropping all tables...")
SQLModel.metadata.drop_all(engine)
print("Creating all tables with new UUID schemas...")
SQLModel.metadata.create_all(engine)
print("Database migration complete!")
