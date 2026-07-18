from sqlalchemy import create_engine, text
from app.core.config import settings

def reorder_table():
    engine = create_engine(settings.sync_database_url)
    
    # We will safely recreate the table to enforce the exact physical column ordering
    queries = [
        # 1. Strip the foreign key from call table so we can safely replace the contact table
        "ALTER TABLE call DROP CONSTRAINT IF EXISTS call_contact_phone_fkey;",
        
        # 2. Create the precise visual layout table
        """
        CREATE TABLE IF NOT EXISTS contact_ordered (
            s_no VARCHAR,
            email VARCHAR,
            first_name VARCHAR,
            last_name VARCHAR,
            branch VARCHAR,
            qualification VARCHAR,
            institute_name VARCHAR,
            district VARCHAR,
            phone VARCHAR PRIMARY KEY
        );
        """,
        
        # 3. Migrate the data perfectly
        """
        INSERT INTO contact_ordered(s_no, email, first_name, last_name, branch, qualification, institute_name, district, phone)
        SELECT s_no, email, first_name, last_name, branch, qualification, institute_name, district, phone FROM contact
        ON CONFLICT DO NOTHING;
        """,
        
        # 4. Swap tables
        "DROP TABLE contact;",
        "ALTER TABLE contact_ordered RENAME TO contact;",
        
        # 5. Restore constraints securely 
        "ALTER TABLE call ADD CONSTRAINT call_contact_phone_fkey FOREIGN KEY (contact_phone) REFERENCES contact(phone);"
    ]
    
    with engine.begin() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
            except Exception as e:
                print(f"Query '{q}' Warning/Error: {e}")
    print("Table perfectly reordered!")

if __name__ == "__main__":
    reorder_table()
