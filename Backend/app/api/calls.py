from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
import httpx
from sqlmodel import Session, select
from app.core.config import settings
from app.database.connection import get_session
from app.models.domain import Call

router = APIRouter(prefix="/calls", tags=["calls"])

class CallRequest(BaseModel):
    phone_number: str
    contact_name: str = "Unknown Lead"

@router.get("/history")
def get_call_history(db: Session = Depends(get_session)):
    calls = db.exec(select(Call)).all()
    return calls

@router.post("/trigger")
async def trigger_outbound_call(call_req: CallRequest, db: Session = Depends(get_session)):
    import uuid
    # Immediately instantiate the Call Record in AOTMS Database
    new_call = Call(
        contact_phone=call_req.phone_number,
        campaign_id=1,
        vendor_call_sid=str(uuid.uuid4()),
        result_status="Pending"
    )
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    return {"message": "Call initiated locally.", "data": new_call}

@router.post("/ravan-webhook")
async def ravan_call_webhook(request: Request, db: Session = Depends(get_session)):
    # Absorb standard webhook payload from Ravan dynamically
    payload = await request.json()
    
    # Normally Ravan will return a specific vendor Call SID or Contact Phone to match against our DB
    # For now we gracefully extract and log the structure
    call_sid = payload.get("callId") or payload.get("id")
    
    analysis = payload.get("postCallAnalysis", {})
    if not analysis and "data" in payload:
        # Check if wrapped in data
        analysis = payload["data"].get("postCallAnalysis", {})
        call_sid = payload["data"].get("id", call_sid)

    # In a full deployment, we execute DB match on call_sid:
    if call_sid:
        target_call = db.exec(select(Call).where(Call.vendor_call_sid == call_sid)).first()
        if target_call:
            # Map intelligence to our newly created columns!
            target_call.sentiment = analysis.get("sentiments")
            target_call.summary = analysis.get("summary")
            target_call.extracted_email = analysis.get("email")
            target_call.extracted_name = analysis.get("name")
            target_call.result_status = "Completed"
            
            # Map Recording URL if it exists
            target_call.recording_url = payload.get("recordingUrl") or payload.get("data", {}).get("recordingUrl")
            
            db.commit()
            
    # Autonomous "+" Linear Accumulation for Dashboard Metrics!
    try:
        from app.models.domain import DashboardMetrics
        from datetime import datetime
        agent_id = payload.get("agentId") or payload.get("data", {}).get("agentId")
        
        if agent_id:
            metric = db.exec(select(DashboardMetrics).where(DashboardMetrics.agent_id == agent_id)).first()
            if not metric:
                metric = DashboardMetrics(agent_id=agent_id)
                db.add(metric)
            
            new_cost = float(payload.get("costTotal") or payload.get("data", {}).get("costTotal") or 0.0)
            new_duration = int(payload.get("durationSec") or payload.get("data", {}).get("durationSec") or 0)
            status_val = str(payload.get("status") or payload.get("data", {}).get("status") or "").lower()
            
            # Immediately add exactly using the requested "+" Operater natively (multiplying by 7rs exchange explicitly)!
            metric.total_cost = round(metric.total_cost + (new_cost * 7.0), 4)
            metric.total_duration_sec += new_duration
            metric.total_calls += 1
            
            if status_val in ["completed", "success"]:
                metric.success_calls += 1
            elif status_val in ["failed", "no_answer", "busy"]:
                metric.failed_calls += 1
                
                # Auto-generate SOS Task: Find assigned User ID
                try:
                    from app.models.domain import Assign_Agents
                    from app.models.models_todo import Todo, TodoActivity
                    
                    mapping = db.exec(select(Assign_Agents).where(Assign_Agents.agent_id == agent_id)).first()
                    user_id = mapping.user_id if mapping else 1
                    
                    # Create SOS Task
                    title = f"🚨 Call Handoff Alert ({status_val.upper()})"
                    details = f"Automatic SOS created due to call drop/failure. Agent: {agent_id}. Duration: {new_duration}s. Cost: {new_cost}."
                    
                    sos_todo = Todo(
                        title=title,
                        description=details,
                        priority="SOS",
                        status="Pending",
                        category="Lead Follow-up",
                        agent_id=agent_id,
                        user_id=user_id,
                        subtasks="[]"
                    )
                    db.add(sos_todo)
                    db.commit()
                    db.refresh(sos_todo)
                    
                    # Log Activity
                    activity = TodoActivity(
                        todo_id=sos_todo.id,
                        action="Created",
                        details=f"Auto-generated critical SOS alarm for call failure ({status_val})."
                    )
                    db.add(activity)
                    db.commit()
                    print(f"SOS TASK AUTO-GENERATED -> Created Todo {sos_todo.id} for User {user_id}")
                except Exception as ex_todo:
                    print("SOS Task Auto-Generation Error:", str(ex_todo))
                
            if metric.total_calls > 0:
                metric.success_rate = round((metric.success_calls / metric.total_calls) * 100, 2)
                
            metric.last_updated = datetime.utcnow()
            db.commit()
            print(f"WEBHOOK INTERCEPTED -> Added +{new_cost} Cost internally to Agent {agent_id}")
    except Exception as ex:
        print("Webhook Metric Injection Trapped Error:", str(ex))
            
    return {"message": "Webhook absorbed and Metrics Accumulated successfully."}
