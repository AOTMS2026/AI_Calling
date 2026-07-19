from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.database.connection import get_session, engine
from app.models.domain import Contact, Call
from app.services.exotel import exotel_client
import io
import csv
import os
import tempfile
import openpyxl
import uuid

router = APIRouter(prefix="/contacts", tags=["contacts"])

# Temporary in-memory state tracking to hold live progress percentages
UPLOAD_JOBS = {}

def process_bulk_excel(file_path: str, job_id: str):
    try:
        # read_only=True ensures minimal memory usage for millions of rows
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        sheet = wb.active
        
        batch_size = 5000
        batch = []
        
        with Session(engine) as session:
            # We map indexes dynamically based on the exact user header fields:
            header_map = {}
            for i, row in enumerate(sheet.iter_rows(values_only=True)):
                if not header_map:
                    # Parse headers dynamically (scan downward until we find the real headers)
                    row_str = str(row).lower()
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
                phone = get_val('phone') or ''
                
                # Skip completely empty rows
                if not phone and not email:
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
                    "phone": phone if phone else f"NO-PHONE-{i}" # Ensure unique PK even if empty
                })
                
                if len(batch) >= batch_size:
                    stmt = pg_insert(Contact).values(batch).on_conflict_do_nothing()
                    session.execute(stmt)
                    session.commit()
                    batch = []
                    
                # Calculate deterministic progress approx (openpyxl max_row is an estimate or exact)
                total_approx = sheet.max_row or 1000
                progress_pct = min(99, int((i / total_approx) * 100))
                UPLOAD_JOBS[job_id]["progress"] = progress_pct
                    
            # Insert any remaining records
            if batch:
                stmt = pg_insert(Contact).values(batch).on_conflict_do_nothing()
                session.execute(stmt)
                session.commit()
                
            UPLOAD_JOBS[job_id]["progress"] = 100
            UPLOAD_JOBS[job_id]["status"] = "completed"
                
    except Exception as e:
        print(f"Failed background import: {e}")
        if job_id in UPLOAD_JOBS:
            UPLOAD_JOBS[job_id]["status"] = "failed"
            UPLOAD_JOBS[job_id]["error"] = str(e)
    finally:
        if 'wb' in locals():
            wb.close()
            
        # Cleanup temporary file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as cleanup_error:
                print(f"Warning: Could not remove temporary file {file_path}: {cleanup_error}")


@router.get("/upload-progress/{job_id}")
async def get_upload_progress(job_id: str):
    if job_id not in UPLOAD_JOBS:
        return {"status": "not_found", "progress": 0}
    return UPLOAD_JOBS[job_id]

@router.post("/bulk-upload")
async def bulk_upload_contacts(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...)
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx) files are allowed for bulk upload")
        
    job_id = str(uuid.uuid4())
    UPLOAD_JOBS[job_id] = {"status": "processing", "progress": 0}
    
    try:
        fd, temp_path = tempfile.mkstemp(suffix=".xlsx")
        with os.fdopen(fd, 'wb') as f:
            content = await file.read()
            f.write(content)
            
        background_tasks.add_task(process_bulk_excel, temp_path, job_id)
    except Exception as e:
        UPLOAD_JOBS[job_id] = {"status": "failed", "error": str(e)}
        raise HTTPException(status_code=500, detail=f"Failed to initiate upload: {str(e)}")
        
    return {"message": "Bulk upload started", "job_id": job_id}

@router.post("/upload")
async def upload_contacts(file: UploadFile = File(...), db: Session = Depends(get_session)):
    current_user_id = 1 
    
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
    contents = await file.read()
    try:
        decoded_content = contents.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded_content))
        
        for row in reader:
            contact = Contact(
                phone=row.get('phone', ''),
                first_name=row.get('name', 'Unknown')
            )
            db.add(contact)
            
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
        
    return {"message": "Contacts uploaded and saved to PostgreSQL successfully"}

@router.get("/")
def get_contacts(db: Session = Depends(get_session), limit: int = 500):
    # Fixed AttributeError: Since we removed 'id', we will map deterministic safety limits using the new 'phone' primary key
    contacts = db.exec(select(Contact).order_by(Contact.phone.asc()).limit(limit)).all()
    return contacts

@router.post("/dial-single/{phone}")
def manual_dial_contact(phone: str, db: Session = Depends(get_session)):
    """Triggers an instantaneous manual call out of the UI bypassing bulk campaigns"""
    new_call = Call(contact_phone=phone, result_status="Calling")
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    result = exotel_client.trigger_outbound_call(phone, campaign_id=None)
    
    if result.get("success"):
        new_call.vendor_call_sid = result.get("vendor_call_sid")
        new_call.result_status = "Pending"
    else:
        new_call.result_status = "Failed"
        db.commit()
        raise HTTPException(status_code=500, detail=result.get("error"))
        
    db.commit()
    return {"message": "Call Dispatched Successfully", "vendor_sid": new_call.vendor_call_sid}

@router.post("/single")
def create_single_contact(contact: Contact, db: Session = Depends(get_session)):
    """Receives JSON from the UI Modal to manually inject a single user"""
    # Safe insert skipping crashes if phone number already exists
    stmt = pg_insert(Contact).values([contact.model_dump()]).on_conflict_do_nothing()
    db.execute(stmt)
    db.commit()
    return {"message": "Contact securely added to PostgreSQL."}
