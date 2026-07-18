import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timedelta
import random
import string
import re

from app.database.connection import get_session
from app.models.domain import User, OTP
from app.schemas.domain import UserCreateRequest, VerifyOTPRequest, LoginRequest, Token
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

def generate_otp():
    return "".join(random.choices(string.digits, k=6))

@router.post("/register")
async def register(request: UserCreateRequest, db: Session = Depends(get_session)):
    if len(request.name) < 3:
        raise HTTPException(status_code=400, detail="Name must be at least 3 characters")
    
    if not re.match(r"^\d{10}$", request.phone):
        raise HTTPException(status_code=400, detail="Phone must be exactly 10 digits")
        
    if request.password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    # Basic password check for prompt requirements
    if len(request.password) < 8 or not re.search(r"[A-Z]", request.password) or not re.search(r"[a-z]", request.password) or not re.search(r"\d", request.password) or not re.search(r"\W", request.password):
        raise HTTPException(status_code=400, detail="Password too weak")
    
    # Check if user exists
    user_db = db.exec(select(User).where(User.email == request.email)).first()
    if user_db:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(request.password)
    new_user = User(
        name=request.name,
        email=request.email,
        phone=request.phone,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate OTP
    otp_code = generate_otp()
    new_otp = OTP(
        user_id=new_user.id,
        code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(new_otp)
    db.commit()
    
    # Trigger webhook asynchronously
    async with httpx.AsyncClient() as client:
        try:
            await client.post(settings.N8N_WEBHOOK_URL, json={
                "email": new_user.email,
                "name": new_user.name,
                "otp": otp_code
            })
        except Exception as e:
            print(f"Webhook error: {e}")
            
    return {"message": "User created. OTP sent to email."}

@router.post("/verify-otp")
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == request.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = db.exec(select(OTP).where(OTP.user_id == user.id, OTP.code == request.code, OTP.is_used == False)).first()
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    otp.is_used = True
    db.commit()
    
    return {"message": "OTP Verified successfully."}

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.email == request.email)).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid Credentials")
        
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
