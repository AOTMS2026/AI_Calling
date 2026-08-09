from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class UserBase(SQLModel):
    name: str
    email: str = Field(index=True, unique=True)
    phone: str
    role: str = Field(default="customer")
    ravan_agent_id: Optional[str] = None
    ravan_campaign_id: Optional[str] = None
    ravan_phone_number_id: Optional[str] = None
    ravan_api_key: Optional[str] = None
    ravan_org_id: Optional[str] = None
    agent_quota: int = Field(default=0)
    allocated_credits: float = Field(default=0.0)

class UserCreate(UserBase):
    password: str
    confirm_password: str

class User(UserBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    hashed_password: str

class OTP(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    code: str
    expires_at: datetime
    is_used: bool = Field(default=False)

class Contact(SQLModel, table=True):
    s_no: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    name: Optional[str] = None
    branch: Optional[str] = None
    qualification: Optional[str] = None
    institute_name: Optional[str] = None
    district: Optional[str] = None
    phone: str = Field(primary_key=True)
    contact_id: Optional[str] = Field(default=None, index=True)
    campaign_id: Optional[str] = Field(default=None, index=True)
    agent_id: Optional[str] = Field(default=None, index=True)
    tags: Optional[str] = None

class Campaign(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    name: str
    prompt: Optional[str] = None
    voice: Optional[str] = None
    status: str = Field(default="Draft") # Draft, Active, Completed

class Call(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    vendor_call_sid: Optional[str] = Field(default=None, index=True)
    contact_phone: str = Field(foreign_key="contact.phone")
    campaign_id: Optional[str] = Field(default=None, foreign_key="campaign.id")
    duration: Optional[int] = None
    transcript: Optional[str] = None
    result_status: str = Field(default="Pending") # Pending, Calling, Answered, Busy, No Answer, Failed, Completed
    
    # Ravan Post-Call AI Extraction Meta
    sentiment: Optional[str] = None
    summary: Optional[str] = None
    extracted_email: Optional[str] = None
    extracted_name: Optional[str] = None
    recording_url: Optional[str] = None

class AppointmentBooking(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    agent_id: Optional[str] = None
    org_id: Optional[str] = None
    name: str = Field(index=True)
    email: str
    phone: str
    appointment_datetime: str
    appointment_id: Optional[str] = None
    call_session_id: Optional[str] = None
    notes: Optional[str] = None
    days_ahead: Optional[int] = None
    action: Optional[str] = Field(default="book")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CalcomConfiguration(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    agent_id: str = Field(index=True)
    api_key: str
    event_id: str
    timezone: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InboundCampaign(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    phone_number: str = Field(index=True)
    agent_id: str
    agent_name: str
    timezone: str = Field(default="Asia/Kolkata")
    max_concurrent: int = Field(default=1)
    budget_credits: Optional[str] = Field(default="Unlimited")
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    window_start: Optional[str] = None
    window_end: Optional[str] = None
    active_days: str = Field(default="1,2,3,4,5,6,0")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PurchasedPhoneNumber(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    platform_id: Optional[str] = None
    phone_number: str = Field(index=True, unique=True)
    price: float = Field(default=0.0)
    per_minute_price_inbound: float = Field(default=0.0)
    per_minute_price_outbound: float = Field(default=0.0)
    status: str = Field(default="Active")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DashboardMetrics(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    agent_id: str = Field(index=True)
    total_duration_sec: int = Field(default=0)
    total_cost: float = Field(default=0.0)
    total_calls: int = Field(default=0)
    success_calls: int = Field(default=0)
    failed_calls: int = Field(default=0)
    success_rate: float = Field(default=0.0)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class CallRecord(SQLModel, table=True):
    """Persists every individual call from Ravan.ai with cost tracking."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    call_id: str = Field(index=True, unique=True)  # Ravan session UUID (upsert key)
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    caller_number: Optional[str] = None
    callee_number: Optional[str] = None
    caller_name: Optional[str] = None
    channel: Optional[str] = None  # web_call, outbound_call, inbound
    status: str = Field(default="pending")  # pending, ended, completed, failed
    duration_sec: int = Field(default=0)
    credits_used: float = Field(default=0.0)  # Raw credits from Ravan costTotal
    cost: float = Field(default=0.0)  # credits_used × 7
    summary: Optional[str] = None
    transcript: Optional[str] = None  # JSON stringified transcript array
    recording_url: Optional[str] = None
    disconnect_reason: Optional[str] = None
    sentiment: Optional[str] = None
    error_message: Optional[str] = None
    metadata_json: Optional[str] = None  # Full metadata as JSON string
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Assign_Agents(SQLModel, table=True):
    agent_id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", primary_key=True)
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Assign_Campaigns(SQLModel, table=True):
    campaign_id: str = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", primary_key=True)
    agent_id: Optional[str] = None
    campaign_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
