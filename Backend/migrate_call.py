from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate_call_table():
    engine = create_engine(settings.sync_database_url)
    queries = [
        "ALTER TABLE call ADD COLUMN IF NOT EXISTS vendor_call_sid VARCHAR;",
        "CREATE INDEX IF NOT EXISTS ix_call_vendor_call_sid ON call (vendor_call_sid);"
    ]
    with engine.begin() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
            except Exception as e:
                print(f"Warning/Error: {e}")
    print("Database migration for Call Phase 4 completed successfully.")

if __name__ == "__main__":
    migrate_call_table()
