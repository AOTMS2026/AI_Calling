from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class UserBase(SQLModel):
    name: str
    email: str = Field(index=True, unique=True)
    phone: str
    role: str = Field(default="customer")
    ravan_agent_id: Optional[str] = None
    ravan_api_key: Optional[str] = None
    ravan_org_id: Optional[str] = None
    identity_hash: Optional[str] = None

class UserCreate(UserBase):
    password: str
    confirm_password: str

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str

class OTP(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    code: str
    expires_at: datetime
    is_used: bool = Field(default=False)

class Contact(SQLModel, table=True):
    s_no: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    branch: Optional[str] = None
    qualification: Optional[str] = None
    institute_name: Optional[str] = None
    district: Optional[str] = None
    phone: str = Field(primary_key=True)

class Campaign(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    prompt: Optional[str] = None
    voice: Optional[str] = None
    status: str = Field(default="Draft") # Draft, Active, Completed

class Call(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    vendor_call_sid: Optional[str] = Field(default=None, index=True)
    contact_phone: str = Field(foreign_key="contact.phone")
    campaign_id: Optional[int] = Field(default=None, foreign_key="campaign.id")
    duration: Optional[int] = None
    transcript: Optional[str] = None
    result_status: str = Field(default="Pending") # Pending, Calling, Answered, Busy, No Answer, Failed, Completed
    
    # Ravan Post-Call AI Extraction Meta
    sentiment: Optional[str] = None
    summary: Optional[str] = None
    extracted_email: Optional[str] = None
    extracted_name: Optional[str] = None
    recording_url: Optional[str] = None
