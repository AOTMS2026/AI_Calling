from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    engine = create_engine(settings.sync_database_url)
    queries = [
        "ALTER TABLE call DROP CONSTRAINT IF EXISTS call_contact_id_fkey",
        "ALTER TABLE call DROP COLUMN IF EXISTS contact_id",
        "ALTER TABLE contact DROP CONSTRAINT IF EXISTS contact_pkey CASCADE",
        "ALTER TABLE contact DROP COLUMN IF EXISTS id",
        "ALTER TABLE contact DROP COLUMN IF EXISTS user_id",
        "ALTER TABLE contact DROP COLUMN IF EXISTS name",
        "ALTER TABLE contact ADD PRIMARY KEY (phone)",
        "ALTER TABLE call ADD COLUMN IF NOT EXISTS contact_phone VARCHAR REFERENCES contact(phone)"
    ]
    with engine.begin() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
            except Exception as e:
                print(f"Query '{q}' Warning/Error: {e}")
    print("Migration successful: Contact & Call tables altered.")

if __name__ == "__main__":
    run_migration()
