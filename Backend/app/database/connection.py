from sqlmodel import SQLModel, create_engine, Session, text
from app.core.config import settings

engine = create_engine(settings.sync_database_url, echo=False)

def init_db():
    from app.models import domain
    from app.models.models_todo import Todo
    from app.models.models_whatsapp import WhatsAppCampaign, WhatsAppMessage, WhatsAppTemplate, WhatsAppGroup, WhatsAppImportLog
    
    # Run creates first
    SQLModel.metadata.create_all(engine)
    
    # Intercept and run dynamic column patches for existing tables (prevents migration column crashes)
    with engine.begin() as conn:
        # 1. Update user table
        user_cols = [
            ("role", "VARCHAR DEFAULT 'customer'"),
            ("ravan_agent_id", "VARCHAR"),
            ("ravan_campaign_id", "VARCHAR"),
            ("ravan_phone_number_id", "VARCHAR"),
            ("ravan_api_key", "VARCHAR"),
            ("ravan_org_id", "VARCHAR"),
            ("agent_quota", "INTEGER DEFAULT 0"),
            ("allocated_credits", "DOUBLE PRECISION DEFAULT 0.0")
        ]
        for col, col_type in user_cols:
            try:
                conn.execute(text(f'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS {col} {col_type};'))
            except Exception as ex:
                print(f"Failed to verify/add column '{col}' to 'user' table: {ex}")
                
        # 2. Update todo table
        try:
            conn.execute(text("ALTER TABLE todo ADD COLUMN IF NOT EXISTS subtasks VARCHAR DEFAULT '[]';"))
        except Exception as ex:
            print(f"Failed to verify/add column 'subtasks' to 'todo' table: {ex}")

def get_session():
    with Session(engine) as session:
        yield session
