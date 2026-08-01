from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

engine = create_engine(settings.sync_database_url, echo=False)

def init_db():
    from app.models import domain
    from app.models.models_todo import Todo
    from app.models.models_whatsapp import WhatsAppCampaign, WhatsAppMessage, WhatsAppTemplate, WhatsAppGroup, WhatsAppImportLog
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
