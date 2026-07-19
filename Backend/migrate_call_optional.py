from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate_call_table():
    engine = create_engine(settings.sync_database_url)
    queries = [
        "ALTER TABLE call ALTER COLUMN campaign_id DROP NOT NULL;"
    ]
    with engine.begin() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
            except Exception as e:
                print(f"Warning/Error: {e}")
    print("Database migration for removing NOT NULL constraint on campaign_id completed.")

if __name__ == "__main__":
    migrate_call_table()
