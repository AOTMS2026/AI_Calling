from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import uuid
from typing import List, Optional
from pydantic import BaseModel
from app.database.connection import get_session
from app.models.domain import AppointmentBooking, User, CalcomConfiguration
from app.Authentication.auth import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

class AppointmentCreate(BaseModel):
    agent_id: Optional[str] = None
    org_id: Optional[str] = None
    name: str
    email: str
    phone: str
    appointment_datetime: str
    call_session_id: Optional[str] = None
    notes: Optional[str] = None
    days_ahead: Optional[int] = 1
    action: Optional[str] = "book"

@router.post("/book")
def book_appointment(data: AppointmentCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    try:
        # Generate a unique appointment string
        app_id = f"appt_{uuid.uuid4().hex[:8]}"
        
        # Directly save to the local PostgreSQL Database
        new_appointment = AppointmentBooking(
            agent_id=data.agent_id,
            org_id=data.org_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            appointment_datetime=data.appointment_datetime,
            appointment_id=app_id,
            call_session_id=data.call_session_id,
            notes=data.notes,
            days_ahead=data.days_ahead,
            action=data.action
        )
        
        session.add(new_appointment)
        session.commit()
        session.refresh(new_appointment)
        
        return {"success": True, "message": "Appointment confirmed successfully", "data": new_appointment}
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

class CalcomConfigRequest(BaseModel):
    agent_id: str
    api_key: str
    event_id: str
    timezone: str

@router.post("/calcom-config")
def save_calcom_config(request: CalcomConfigRequest, session: Session = Depends(get_session)):
    statement = select(CalcomConfiguration).where(CalcomConfiguration.agent_id == request.agent_id)
    existing = session.exec(statement).first()

    if existing:
        existing.api_key = request.api_key
        existing.event_id = request.event_id
        existing.timezone = request.timezone
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return {"success": True, "message": "Updated configured integration", "id": existing.id}
    else:
        new_config = CalcomConfiguration(
            agent_id=request.agent_id,
            api_key=request.api_key,
            event_id=request.event_id,
            timezone=request.timezone
        )
        session.add(new_config)
        session.commit()
        session.refresh(new_config)
        return {"success": True, "message": "Inserted configured integration", "id": new_config.id}

@router.get("/calcom-config")
def get_all_calcom_configs(session: Session = Depends(get_session)):
    statement = select(CalcomConfiguration)
    results = session.exec(statement).all()
    return results

@router.get("/")
def get_appointments(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    appointments = session.exec(select(AppointmentBooking)).all()
    return {"success": True, "data": appointments}
