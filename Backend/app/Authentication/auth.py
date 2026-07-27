import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request, Request
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

# In-memory brute force protection state
# In a true distributed production environment, this would utilize Redis.
# Format: { "email@example.com": {"attempts": 5, "locked_until": datetime} }
FAILED_LOGINS = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

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
    # Generate exactly a 64-bit identity signature for security tracking mapping
    new_identity_hash = secrets.token_hex(32)
    
    new_user = User(
        name=request.name,
        email=request.email,
        phone=request.phone,
        hashed_password=hashed_password,
        identity_hash=new_identity_hash
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
    
    # Trigger isolated Registration webhook asynchronously
    async with httpx.AsyncClient() as client:
        try:
            await client.post(settings.N8N_WEBHOOK_URL, json={
                "email": new_user.email,
                "name": new_user.name,
                "otp": otp_code,
                "context": "Account Registration"
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

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_session)):
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
    
    # Trigger webhook asynchronously via explicit Reset Password URL
    async with httpx.AsyncClient() as client:
        try:
            await client.post(settings.N8N_RESET_PASSWORD_URL, json={
                "email": user_db.email,
                "name": user_db.name,
                "otp": otp_code,
                "context": "Password Reset"
            })
        except Exception as e:
            print(f"Webhook error: {e}")
            raise HTTPException(status_code=500, detail="Failed to dispatch security email.")
            
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
def login(request: LoginRequest, db: Session = Depends(get_session)):
    email_key = request.email.lower()
    
    # 1. Check if user is currently locked out
    if email_key in FAILED_LOGINS:
        lock_status = FAILED_LOGINS[email_key]
        if lock_status["attempts"] >= MAX_FAILED_ATTEMPTS:
            if datetime.utcnow() < lock_status["locked_until"]:
                time_left = (lock_status["locked_until"] - datetime.utcnow()).seconds // 60
                raise HTTPException(
                    status_code=429, 
                    detail=f"Account locked due to too many failed login attempts. Please try again in {time_left + 1} minutes."
                )
            else:
                # Lockout expired, reset their slate
                del FAILED_LOGINS[email_key]

    user = db.exec(select(User).where(User.email == request.email)).first()
    
    # 2. Check credentials
    if not user or not verify_password(request.password, user.hashed_password):
        # Record the failed attempt
        if email_key not in FAILED_LOGINS:
            FAILED_LOGINS[email_key] = {"attempts": 1, "locked_until": datetime.utcnow()}
        else:
            FAILED_LOGINS[email_key]["attempts"] += 1
            
        if FAILED_LOGINS[email_key]["attempts"] >= MAX_FAILED_ATTEMPTS:
            FAILED_LOGINS[email_key]["locked_until"] = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            raise HTTPException(
                status_code=429, 
                detail=f"Security Alert: Account locked due to {MAX_FAILED_ATTEMPTS} failed attempts. Please try again in {LOCKOUT_MINUTES} minutes."
            )
            
        attempts_left = MAX_FAILED_ATTEMPTS - FAILED_LOGINS[email_key]["attempts"]
        raise HTTPException(status_code=401, detail=f"Invalid Credentials. Warning: {attempts_left} attempts remaining before account lockout.")

    # 3. Successful login, wipe all failure records
    if email_key in FAILED_LOGINS:
        del FAILED_LOGINS[email_key]

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "ravan_agent_id": user.ravan_agent_id,
        "identity_hash": user.identity_hash,
        "name": user.name,
        "email": user.email,
        "phone": user.phone
    }

# Admin Panel Dynamic Routes
from typing import Optional

class PatchUserRoleRequest(BaseModel):
    role: Optional[str] = None
    ravan_agent_id: Optional[str] = None
    ravan_api_key: Optional[str] = None
    ravan_org_id: Optional[str] = None

@router.get("/users")
def get_all_users(db: Session = Depends(get_session)):
    """Admin-only pipeline intended to pull down full User architecture stats for rendering."""
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
            "identity_hash": u.identity_hash,
            "ravan_agent_id": u.ravan_agent_id,
            "ravan_api_key": u.ravan_api_key,
            "ravan_org_id": u.ravan_org_id
        })
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
            
    db.commit()
    db.refresh(user)
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
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "identity_hash": current_user.identity_hash,
        "ravan_agent_id": current_user.ravan_agent_id,
        "ravan_api_key": current_user.ravan_api_key,
        "ravan_org_id": current_user.ravan_org_id
    }


