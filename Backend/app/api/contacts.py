from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Response
from sqlmodel import Session, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.database.connection import get_session, engine
from app.models.domain import Contact, Call, User
from app.api.dependencies import get_current_user
import io
import csv
import os
import tempfile
import openpyxl
import uuid
import json
from typing import List, Any
from app.core.redis_client import get_cache, set_cache, delete_cache, generate_cache_key

def serialize_models(models: List[Any]) -> List[dict]:
    serialized = []
    for m in models:
        try:
            serialized.append(json.loads(m.model_dump_json()))
        except AttributeError:
            serialized.append(json.loads(m.json()))
    return serialized

async def invalidate_contact_caches():
    try:
        # Contacts doesn't have tenant structures, so delete global keys
        await delete_cache("contacts_global")
    except Exception as e:
        print(f"Failed to invalidate contact caches: {e}")

router = APIRouter(prefix="/contacts", tags=["contacts"])

# Temporary in-memory state tracking to hold live progress percentages
UPLOAD_JOBS = {}

def process_bulk_excel(file_path: str, job_id: str):
    try:
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        sheet = wb.active
        
        batch_size = 5000
        batch = []
        
        with Session(engine) as session:
            header_map = {}
            for i, row in enumerate(sheet.iter_rows(values_only=True)):
                if not header_map:
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
                    "phone": phone if phone else f"NO-PHONE-{i}"
                })
                
                if len(batch) >= batch_size:
                    stmt = pg_insert(Contact).values(batch).on_conflict_do_nothing()
                    session.execute(stmt)
                    session.commit()
                    batch = []
                    
                total_approx = sheet.max_row or 1000
                progress_pct = min(99, int((i / total_approx) * 100))
                UPLOAD_JOBS[job_id]["progress"] = progress_pct
                    
            if batch:
                stmt = pg_insert(Contact).values(batch).on_conflict_do_nothing()
                session.execute(stmt)
                session.commit()
                
            UPLOAD_JOBS[job_id]["progress"] = 100
            UPLOAD_JOBS[job_id]["status"] = "completed"
            
            try:
                import asyncio
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(invalidate_contact_caches())
                else:
                    loop.run_until_complete(invalidate_contact_caches())
            except Exception as cache_err:
                print(f"Failed cache invalidation in import: {cache_err}")

                
    except Exception as e:
        print(f"Failed background import: {e}")
        if job_id in UPLOAD_JOBS:
            UPLOAD_JOBS[job_id]["status"] = "failed"
            UPLOAD_JOBS[job_id]["error"] = str(e)
    finally:
        if 'wb' in locals():
            wb.close()
            
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
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
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
async def upload_contacts(
    file: UploadFile = File(...), 
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    
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
        await invalidate_contact_caches()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
        
    return {"message": "Contacts uploaded and saved to PostgreSQL successfully"}

@router.get("/")
async def get_contacts(
    response: Response,
    db: Session = Depends(get_session), 
    limit: int = 500,
    current_user: User = Depends(get_current_user)
):
    response.headers["Cache-Control"] = "public, max-age=10, s-maxage=60"
    cache_key = generate_cache_key("contacts_global", limit=limit)
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    contacts = db.exec(select(Contact).order_by(Contact.phone.asc()).limit(limit)).all()
    await set_cache(cache_key, serialize_models(contacts), ttl_seconds=30)
    return contacts

@router.post("/dial-single/{phone}")
def manual_dial_contact(phone: str, db: Session = Depends(get_session)):
    """Triggers an instantaneous manual call out of the UI bypassing bulk campaigns. Stripped for clean architecture."""
    new_call = Call(contact_phone=phone, result_status="Failed - APIs Removed")
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    return {"message": "Call Dispatched architecture successfully removed.", "vendor_sid": new_call.vendor_call_sid}

@router.post("/single")
async def create_single_contact(
    contact: Contact, 
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Receives JSON from the UI Modal to manually inject a single user"""

    # Safe insert skipping crashes if phone number already exists
    stmt = pg_insert(Contact).values([contact.model_dump()]).on_conflict_do_nothing()
    db.execute(stmt)
    db.commit()
    await invalidate_contact_caches()
    return {"message": "Contact securely added to PostgreSQL."}
