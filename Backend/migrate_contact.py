from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    engine = create_engine(settings.sync_database_url)
    queries = [
        "ALTER TABLE contact ADD COLUMN IF NOT EXISTS s_no VARCHAR;",
        "ALTER TABLE contact ADD COLUMN IF NOT EXISTS email VARCHAR;",
        "ALTER TABLE contact ADD COLUMN IF NOT EXISTS first_name VARCHAR;",
        "ALTER TABLE contact ADD COLUMN IF NOT EXISTS last_name VARCHAR;",
        "ALTER TABLE contact ADD COLUMN IF NOT EXISTS branch VARCHAR;",
        "ALTER TABLE contact ADD COLUMN IF NOT EXISTS qualification VARCHAR;",
        "ALTER TABLE contact ADD COLUMN IF NOT EXISTS institute_name VARCHAR;",
        "ALTER TABLE contact ADD COLUMN IF NOT EXISTS district VARCHAR;"
    ]
    with engine.begin() as conn:
        for q in queries:
            conn.execute(text(q))
    print("Migration successful: Contact table altered.")

if __name__ == "__main__":
    run_migration()
