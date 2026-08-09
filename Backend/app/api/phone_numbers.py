from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
import uuid
import datetime
from sqlmodel import Session, select
from app.api.dependencies import get_current_user
from app.models.domain import User, PurchasedPhoneNumber
from app.database.connection import get_session
from typing import List

router = APIRouter(prefix="/phone-numbers", tags=["phone-numbers"])

@router.get("/my")
async def get_my_phone_numbers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    records = db.exec(
        select(PurchasedPhoneNumber).where(PurchasedPhoneNumber.user_id == current_user.id)
    ).all()
    
    return {"success": True, "data": records}

@router.get("/available-numbers/{country}")
async def get_available_numbers(
    country: str,
    region: str = None,
    current_user: User = Depends(get_current_user)
):
    """
    Mocks fetching available phone numbers from Ravan.ai.
    """
    # Return dummy data for Indian numbers
    return {
        "success": True,
        "data": [
            {
                "phone_number": "+918031449343",
                "price": 295.0,
                "monthly_fee": 295.0,
                "currency": "INR",
                "capabilities": ["voice", "sms"],
                "region": region or country
            },
            {
                "phone_number": "+918031449344",
                "price": 295.0,
                "monthly_fee": 295.0,
                "currency": "INR",
                "capabilities": ["voice", "sms"],
                "region": region or country
            },
            {
                "phone_number": "+918031449345",
                "price": 295.0,
                "monthly_fee": 295.0,
                "currency": "INR",
                "capabilities": ["voice", "sms"],
                "region": region or country
            }
        ]
    }

@router.post("/buy")
async def buy_phone_number(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    phone_number = payload.get("phone_number")
    price = payload.get("price", 295.0)
    
    if not phone_number:
        raise HTTPException(status_code=400, detail="Phone number is required")
        
    new_number = PurchasedPhoneNumber(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        phone_number=phone_number,
        price=price,
        per_minute_price_inbound=0.6,
        per_minute_price_outbound=0.6,
        status="Activate"
    )
    db.add(new_number)
    db.commit()
    
    return {"success": True, "message": "Phone number purchase requested."}

@router.get("/all")
async def get_all_phone_numbers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    records = db.exec(select(PurchasedPhoneNumber)).all()
    
    # Need to append user email for admin view
    res = []
    for r in records:
        user = db.exec(select(User).where(User.id == r.user_id)).first()
        r_dict = r.model_dump()
        r_dict["user_email"] = user.email if user else "Unknown"
        res.append(r_dict)
        
    return {"success": True, "data": res}

@router.patch("/{id}/status")
async def update_phone_number_status(
    id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    record = db.exec(select(PurchasedPhoneNumber).where(PurchasedPhoneNumber.id == id)).first()
    if not record:
        raise HTTPException(status_code=404, detail="Phone number not found")
        
    status = payload.get("status")
    if status:
        record.status = status
        db.add(record)
        db.commit()
        
    return {"success": True}
