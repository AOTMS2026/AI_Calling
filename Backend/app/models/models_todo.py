from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Todo(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: Optional[str] = None
    priority: str = Field(default="Medium") # Urgent, High, Medium, Low
    status: str = Field(default="Pending") # Pending, In Progress, Completed
    category: str = Field(default="General") # General, Campaign Prep, Agent Tuning, Lead Follow-up, Maintenance
    due_date: Optional[str] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    user_id: str = Field(foreign_key="user.id")
    subtasks: Optional[str] = Field(default="[]") # Store checkable subtasks as JSON list of dicts: [{"text": str, "done": bool}]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TodoActivity(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    todo_id: str
    action: str  # Created, Updated, Subtask Updated, Toggled Status, Exported, Deleted
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
