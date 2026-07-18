import os
import openpyxl
from sqlmodel import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.database.connection import engine
from app.models.domain import Contact

def run_import(file_path: str):
    print(f"Starting direct import from: {file_path}")
    wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
    sheet = wb.active
    
    batch_size = 5000
    batch = []
    
    with Session(engine) as session:
        header_map = {}
        processed = 0
        skipped = 0
        
        for i, row in enumerate(sheet.iter_rows(values_only=True)):
            if not header_map:
                row_str = str(row).lower()
                # Stricter detection matching precise column existence to bypass the huge merged string in Row 1
                if 'email' in row_str and 'first name' in row_str and 'phone' in row_str:
                    for idx, cell in enumerate(row):
                        if not cell: continue
                        h = str(cell).strip().lower()
                        if 's.n' in h or 'sno' in h: header_map['s_no'] = idx
                        elif 'email' in h: header_map['email'] = idx
                        elif 'first name' in h: header_map['first_name'] = idx
                        elif 'last name' in h: header_map['last_name'] = idx
                        elif 'branch' in h: header_map['branch'] = idx
                        elif 'qualification' in h: header_map['qualification'] = idx
                        elif 'institue' in h or 'institute' in h: header_map['institute_name'] = idx
                        elif 'district' in h: header_map['district'] = idx
                        elif 'phone' in h: header_map['phone'] = idx
                    print("Identified Headers:", header_map)
                continue 
            
            def get_val(key):
                if key in header_map and header_map[key] < len(row):
                    v = row[header_map[key]]
                    return str(v).strip() if v is not None else None
                return None

            s_no = get_val('s_no')
            email = get_val('email')
            first_name = get_val('first_name')
            last_name = get_val('last_name')
            branch = get_val('branch')
            qualification = get_val('qualification')
            institute_name = get_val('institute_name')
            district = get_val('district')
            phone = get_val('phone')
            
            if not phone and not email:
                skipped += 1
                continue

            batch.append({
                "s_no": s_no,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "branch": branch,
                "qualification": qualification,
                "institute_name": institute_name,
                "district": district,
                "phone": phone if phone else f"NO-PHONE-{i}-{os.urandom(2).hex()}"
            })
            
            if len(batch) >= batch_size:
                stmt = pg_insert(Contact).values(batch).on_conflict_do_nothing()
                session.execute(stmt)
                session.commit()
                processed += len(batch)
                print(f"Committed {processed} records...")
                batch = []
                
        # Insert remaining 
        if batch:
            stmt = pg_insert(Contact).values(batch).on_conflict_do_nothing()
            session.execute(stmt)
            session.commit()
            processed += len(batch)
            print(f"Committed {processed} records...")
            
    print(f"DONE! Total Processed: {processed}, Skipped Empty Rows: {skipped}")

if __name__ == "__main__":
    target_file = r"C:\Users\raman\Videos\AI_Calling\AOTMS_Inbound_Districts_Campaign_Leads_WithPhoneOnly.xlsx"
    run_import(target_file)
