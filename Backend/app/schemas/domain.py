from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

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
