from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str
    ravan_agent_id: Optional[str] = None

class UserCreateRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    confirm_password: str

class VerifyOTPRequest(BaseModel):
    email: str
    code: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str
    confirm_password: str
