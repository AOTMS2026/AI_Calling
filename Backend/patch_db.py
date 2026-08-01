import logging
from sqlmodel import create_engine, text, SQLModel
from app.core.config import settings
from app.models.models_todo import Todo
from app.models.models_whatsapp import WhatsAppCampaign, WhatsAppMessage, WhatsAppTemplate, WhatsAppGroup, WhatsAppImportLog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("patch_db")

def patch():
    engine = create_engine(settings.sync_database_url)
    
    # 1. Add subtasks column to todo table if it doesn't exist
    logger.info("Checking and patching todo table for missing columns...")
    with engine.begin() as conn:
        try:
            # We are using PostgreSQL/SQLite or similar. Let's do ALTER TABLE ADD COLUMN.
            # Using ADD COLUMN IF NOT EXISTS is standard for PostgreSQL.
            conn.execute(text("ALTER TABLE todo ADD COLUMN IF NOT EXISTS subtasks VARCHAR DEFAULT '[]';"))
            logger.info("Successfully patched todo table with subtasks column.")
        except Exception as e:
            logger.warning(f"Failed to add column using standard PG syntax: {e}. Trying fallback...")
            try:
                # Fallback if SQLite or another dialect is active (e.g. without IF NOT EXISTS)
                conn.execute(text("ALTER TABLE todo ADD COLUMN subtasks VARCHAR DEFAULT '[]';"))
                logger.info("Migrated subtasks column successfully via fallback.")
            except Exception as ex:
                logger.info(f"Column might already exist or failed: {ex}")

    # 2. Check schema table imports and create all new WhatsApp tables
    logger.info("Running create_all to initialize new WhatsApp tables...")
    SQLModel.metadata.create_all(engine)
    logger.info("Database tables verified/created successfully.")

if __name__ == "__main__":
    patch()
