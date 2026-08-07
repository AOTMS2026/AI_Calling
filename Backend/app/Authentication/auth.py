import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlmodel import Session, select
from datetime import datetime, timedelta
import random
import string
import re
import secrets
from pydantic import BaseModel

from app.database.connection import get_session
from app.api.dependencies import get_current_user
from app.models.domain import User, OTP
from app.schemas.domain import UserCreateRequest, VerifyOTPRequest, LoginRequest, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.core.redis_client import redis_client
from app.utils.email import send_smtp_email, get_otp_html_template

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

router = APIRouter(prefix="/auth", tags=["auth"])

def generate_otp():
    return "".join(random.choices(string.digits, k=6))

@router.post("/register")
async def register(request: UserCreateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
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
    
    # Dispatch OTP Code via Brevo SMTP in safe Background Task
    email_html = get_otp_html_template(new_user.name, otp_code, "Account Registration")
    background_tasks.add_task(
        send_smtp_email,
        new_user.email,
        "AOTMS: Your Account Verification OTP",
        email_html
    )
            
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

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    user_db = db.exec(select(User).where(User.email == request.email)).first()
    if not user_db:
        # Don't reveal user existence, but for now we raise 404 to let frontend show gracefully
        raise HTTPException(status_code=404, detail="Email address not found")
        
    # Generate OTP
    otp_code = generate_otp()
    print(f"DEBUG: Backend generated OTP for {user_db.email} -> {otp_code}")
    new_otp = OTP(
        user_id=user_db.id,
        code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(new_otp)
    db.commit()
    
    # Dispatch code via Brevo SMTP in Background Task
    email_html = get_otp_html_template(user_db.name, otp_code, "Password Reset")
    background_tasks.add_task(
        send_smtp_email,
        user_db.email,
        "AOTMS: Your Password Reset OTP Verification Code",
        email_html
    )
            
    return {"message": "Password reset OTP dispatched successfully."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_session)):
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    if len(request.new_password) < 8 or not re.search(r"[A-Z]", request.new_password) or not re.search(r"[a-z]", request.new_password) or not re.search(r"\d", request.new_password) or not re.search(r"\W", request.new_password):
        raise HTTPException(status_code=400, detail="Password too weak. Ensure you have uppercase, lowercase, numbers, and special characters.")
        
    user = db.exec(select(User).where(User.email == request.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Strip whitespace just in case user copy-pasted with a trailing space
    clean_code = request.code.strip()
    
    # Query ordering by ID desc incase of multiple requests
    otp = db.exec(select(OTP).where(OTP.user_id == user.id, OTP.code == clean_code)).first()
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check the code.")
        
    if otp.is_used:
        raise HTTPException(status_code=400, detail="This OTP has already been used. Please request a new link.")
        
    if otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This OTP has expired.")
        
    otp.is_used = True
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password has been reset successfully."}

@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_session)):
    email_key = request.email.lower()
    
    # 1. Check if user is currently locked out
    lockout_ttl = await redis_client.ttl(f"lockout::{email_key}")
    if lockout_ttl > 0:
        time_left = lockout_ttl // 60
        raise HTTPException(
            status_code=429, 
            detail=f"Account locked due to too many failed login attempts. Please try again in {time_left + 1} minutes."
        )

    user = db.exec(select(User).where(User.email == request.email)).first()
    
    # 2. Check credentials
    if not user or not verify_password(request.password, user.hashed_password):
        # Record the failed attempt
        attempts = await redis_client.incr(f"attempts::{email_key}")
        if attempts == 1:
            await redis_client.expire(f"attempts::{email_key}", LOCKOUT_MINUTES * 60)
            
        if attempts >= MAX_FAILED_ATTEMPTS:
            await redis_client.setex(f"lockout::{email_key}", LOCKOUT_MINUTES * 60, "locked")
            await redis_client.delete(f"attempts::{email_key}")
            raise HTTPException(
                status_code=429, 
                detail=f"Security Alert: Account locked due to {MAX_FAILED_ATTEMPTS} failed attempts. Please try again in {LOCKOUT_MINUTES} minutes."
            )
            
        attempts_left = MAX_FAILED_ATTEMPTS - attempts
        raise HTTPException(status_code=401, detail=f"Invalid Credentials. Warning: {attempts_left} attempts remaining before account lockout.")

    # 3. Successful login, wipe all failure records
    await redis_client.delete(f"attempts::{email_key}")
    await redis_client.delete(f"lockout::{email_key}")

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "ravan_agent_id": user.ravan_agent_id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone
    }

# Admin Panel Dynamic Routes
from typing import Optional

class PatchUserRoleRequest(BaseModel):
    role: Optional[str] = None
    ravan_agent_id: Optional[str] = None
    ravan_campaign_id: Optional[str] = None
    ravan_phone_number_id: Optional[str] = None
    ravan_api_key: Optional[str] = None
    ravan_org_id: Optional[str] = None
    agent_quota: Optional[int] = None
    allocated_credits: Optional[float] = None

@router.get("/users")
async def get_all_users(db: Session = Depends(get_session)):
    """Admin-only pipeline intended to pull down full User architecture stats for rendering."""
    from app.core.redis_client import get_cache, set_cache
    
    # 1. Structural Memory Cache hit logically
    cached_payload = await get_cache("admin_global_users")
    if cached_payload: 
        print("⚡ REDIS CACHE HIT: Extracted Global User array natively in <1ms!")
        return cached_payload
    
    users = db.exec(select(User).order_by(User.id.desc())).all()
    # Exclude hashed_password natively
    safe_users = []
    for u in users:
        safe_users.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "ravan_agent_id": u.ravan_agent_id,
            "ravan_campaign_id": u.ravan_campaign_id,
            "ravan_phone_number_id": u.ravan_phone_number_id,
            "ravan_api_key": u.ravan_api_key,
            "ravan_org_id": u.ravan_org_id,
            "agent_quota": u.agent_quota,
            "allocated_credits": u.allocated_credits
        })
        
    await set_cache("admin_global_users", safe_users, 600)
    return safe_users

@router.patch("/users/{user_id}")
def update_user_authorization(user_id: int, request: PatchUserRoleRequest, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if request.role is not None:
        user.role = request.role
    if request.ravan_agent_id is not None:
        if request.ravan_agent_id == "":
            user.ravan_agent_id = None
        else:
            user.ravan_agent_id = request.ravan_agent_id
            
    if request.ravan_campaign_id is not None:
        if request.ravan_campaign_id == "":
            user.ravan_campaign_id = None
        else:
            user.ravan_campaign_id = request.ravan_campaign_id
            
    if request.ravan_phone_number_id is not None:
        if request.ravan_phone_number_id == "":
            user.ravan_phone_number_id = None
        else:
            user.ravan_phone_number_id = request.ravan_phone_number_id
            
    if request.ravan_api_key is not None:
        if request.ravan_api_key == "":
            user.ravan_api_key = None
        else:
            user.ravan_api_key = request.ravan_api_key
            
    if request.ravan_org_id is not None:
        if request.ravan_org_id == "":
            user.ravan_org_id = None
        else:
            user.ravan_org_id = request.ravan_org_id
            
    if request.agent_quota is not None:
        user.agent_quota = request.agent_quota
        
    if request.allocated_credits is not None:
        user.allocated_credits = request.allocated_credits
        
    db.commit()
    db.refresh(user)
    
    from app.core.redis_client import delete_cache
    import asyncio
    asyncio.run(delete_cache("admin_global_users"))
    asyncio.run(delete_cache(f"user_auth_profile_{user.email}"))
    
    return {"message": "User properties successfully synced securely."}

@router.get("/verify-org/{org_id}")
async def verify_org_id(org_id: str):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not mapped.")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://api.ravan.ai/api/v1/organizations/profile/{org_id}",
                headers={
                    "X-Api-Key": settings.RAVAN_AGNI_AI,
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
            )
            if response.status_code == 200:
                return {"success": True, "valid": True}
            else:
                return {"success": False, "detail": "Invalid Ravan Organization ID. Cannot Confirm.", "status_code": response.status_code}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to communicate with Ravan.ai: {str(e)}")

@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    from app.core.redis_client import get_cache, set_cache
    cache_key = f"user_auth_profile_{current_user.email}"
    
    cached_payload = await get_cache(cache_key)
    if cached_payload: 
        print(f"⚡ REDIS CACHE HIT: Extracted Auth Profile natively for {current_user.email} in <1ms!")
        return cached_payload
    
    data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "ravan_agent_id": current_user.ravan_agent_id,
        "ravan_campaign_id": current_user.ravan_campaign_id,
        "ravan_phone_number_id": current_user.ravan_phone_number_id,
        "ravan_api_key": current_user.ravan_api_key,
        "ravan_org_id": current_user.ravan_org_id,
        "agent_quota": current_user.agent_quota,
        "allocated_credits": current_user.allocated_credits
    }
    await set_cache(cache_key, data, 1200) # 20 Minutes caching footprint perfectly optimized
    return data


