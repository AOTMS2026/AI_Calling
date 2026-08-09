from fastapi import APIRouter, HTTPException, Depends, Response
from sqlmodel import Session, select
from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel
import json

from app.database.connection import get_session
from app.api.dependencies import get_current_user
from app.models.models_todo import Todo, TodoActivity
from app.models.domain import User, Campaign, InboundCampaign
from app.core.redis_client import get_cache, set_cache, delete_cache, generate_cache_key

def serialize_models(models: List[Any]) -> List[dict]:
    serialized = []
    for m in models:
        try:
            serialized.append(json.loads(m.model_dump_json()))
        except AttributeError:
            serialized.append(json.loads(m.json()))
    return serialized

async def invalidate_todo_caches(user_id: str):
    try:
        await delete_cache(f"todos_{user_id}")
        await delete_cache(f"todos_activities_{user_id}")
        await delete_cache(f"todos_sos_{user_id}")
    except Exception as e:
        print(f"Failed to invalidate todo caches: {e}")

router = APIRouter(prefix="/todos", tags=["todos"])

class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    status: str = "Pending"
    category: str = "General"
    due_date: Optional[str] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    campaign_id: Optional[int] = None
    campaign_name: Optional[str] = None
    subtasks: Optional[str] = "[]"

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[str] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    campaign_id: Optional[int] = None
    campaign_name: Optional[str] = None
    subtasks: Optional[str] = None

@router.get("/")
async def list_todos(
    response: Response,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    response.headers["Cache-Control"] = "public, max-age=10, s-maxage=60"
    cache_key = generate_cache_key(f"todos_{current_user.id}", status=status, priority=priority)
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    query = select(Todo).where(Todo.user_id == current_user.id)
    if status:
        query = query.where(Todo.status == status)
    if priority:
        query = query.where(Todo.priority == priority)
    
    query = query.order_by(Todo.created_at.desc())
    todos = session.exec(query).all()
    res = {"status": "success", "data": serialize_models(todos)}
    await set_cache(cache_key, res, ttl_seconds=30)
    return res

@router.get("/activities")
async def list_activities(
    response: Response,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    response.headers["Cache-Control"] = "public, max-age=10, s-maxage=60"
    cache_key = generate_cache_key(f"todos_activities_{current_user.id}")
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    # Fetch activities by joining Todo table to check ownership
    query = select(TodoActivity).join(Todo, Todo.id == TodoActivity.todo_id).where(Todo.user_id == current_user.id)
    query = query.order_by(TodoActivity.timestamp.desc()).limit(50)
    activities = session.exec(query).all()
    res = {"status": "success", "data": serialize_models(activities)}
    await set_cache(cache_key, res, ttl_seconds=30)
    return res

@router.get("/sos-alerts")
async def list_sos_alerts(
    response: Response,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    response.headers["Cache-Control"] = "public, max-age=10, s-maxage=60"
    cache_key = generate_cache_key(f"todos_sos_{current_user.id}")
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    # Fetch active SOS priority tasks
    query = select(Todo).where(
        Todo.user_id == current_user.id,
        Todo.priority == "SOS",
        Todo.status != "Completed"
    ).order_by(Todo.created_at.desc())
    alerts = session.exec(query).all()
    res = {"status": "success", "data": serialize_models(alerts)}
    await set_cache(cache_key, res, ttl_seconds=30)
    return res

@router.post("/")
async def create_todo(
    payload: TodoCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    new_todo = Todo(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=payload.status,
        category=payload.category,
        due_date=payload.due_date,
        agent_id=payload.agent_id,
        agent_name=payload.agent_name,
        campaign_id=payload.campaign_id,
        campaign_name=payload.campaign_name,
        subtasks=payload.subtasks,
        user_id=current_user.id
    )
    session.add(new_todo)
    session.commit()
    session.refresh(new_todo)
    
    # Log Activity
    activity = TodoActivity(
        todo_id=new_todo.id,
        action="Created",
        details=f"Task '{new_todo.title}' initialized with priority '{new_todo.priority}'."
    )
    session.add(activity)
    session.commit()
    
    await invalidate_todo_caches(current_user.id)
    return {"status": "success", "data": new_todo}

@router.patch("/{todo_id}")
async def update_todo(
    todo_id: str,
    payload: TodoUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    todo = session.get(Todo, todo_id)
    if not todo or todo.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Todo not found.")
    
    old_status = todo.status
    old_priority = todo.priority
    
    # Update fields
    for field, val in payload.dict(exclude_unset=True).items():
        setattr(todo, field, val)
        
    session.add(todo)
    session.commit()
    session.refresh(todo)
    
    # Log Activity
    action = "Updated"
    details = f"Task parameters modified."
    if payload.status and payload.status != old_status:
        action = "Toggled Status"
        details = f"Status shifted from '{old_status}' to '{payload.status}'."
    elif payload.priority and payload.priority != old_priority:
        action = "Updated"
        details = f"Priority moved from '{old_priority}' to '{payload.priority}'."
    elif payload.subtasks is not None:
        action = "Subtask Updated"
        details = "Subtask checklist modified."
        
    activity = TodoActivity(
        todo_id=todo.id,
        action=action,
        details=details
    )
    session.add(activity)
    session.commit()
    
    await invalidate_todo_caches(current_user.id)
    return {"status": "success", "data": todo}

@router.delete("/{todo_id}")
async def delete_todo(
    todo_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    todo = session.get(Todo, todo_id)
    if not todo or todo.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Todo not found.")
    
    # Log Activity first before deletion cascade
    activity = TodoActivity(
        todo_id=todo.id,
        action="Deleted",
        details=f"Task '{todo.title}' deleted from pipeline."
    )
    session.add(activity)
    
    session.delete(todo)
    session.commit()
    await invalidate_todo_caches(current_user.id)
    return {"status": "success", "message": "Task completed and deleted successfully"}
