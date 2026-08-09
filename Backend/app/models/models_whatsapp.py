from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class WhatsAppCampaign(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    status: str = Field(default="Draft") # Draft, Scheduled, Running, Paused, Completed, Cancelled
    total_recipients: int = Field(default=0)
    sent_count: int = Field(default=0)
    delivered_count: int = Field(default=0)
    read_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    cost_total: float = Field(default=0.0)
    duplicate_count: int = Field(default=0)
    scheduled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str = Field(foreign_key="user.id")

class WhatsAppMessage(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    campaign_id: Optional[str] = Field(default=None, foreign_key="whatsappcampaign.id")
    recipient_phone: str
    content_text: str
    media_url: Optional[str] = None
    message_type: str = Field(default="text") # text, media, template
    status: str = Field(default="Queued") # Queued, Sent, Delivered, Read, Failed
    retry_count: int = Field(default=0)
    error_message: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    user_id: str = Field(foreign_key="user.id")

class WhatsAppTemplate(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    content: str
    variables: Optional[str] = Field(default="[]") # JSON list of strings (e.g. ["customer_name", "course"])
    approval_status: str = Field(default="Approved") # Pending, Approved, Rejected
    user_id: str = Field(foreign_key="user.id")

class WhatsAppGroup(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    description: Optional[str] = None
    user_id: str = Field(foreign_key="user.id")

class WhatsAppImportLog(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    filename: str
    success_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    errors: Optional[str] = Field(default="[]") # JSON dump of list of errors
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str = Field(foreign_key="user.id")
