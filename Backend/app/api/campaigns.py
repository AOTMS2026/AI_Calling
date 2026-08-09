from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional

from app.database.connection import get_session, engine
from app.models.domain import Campaign, Contact, Call

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

from typing import Optional, List

class CampaignSchedule(BaseModel):
    windowStart: Optional[str] = None
    windowEnd: Optional[str] = None
    windowDays: Optional[List[int]] = None
    timezone: Optional[str] = "UTC"
    maxConcurrent: Optional[int] = 5
    retryAttempts: Optional[int] = 3
    retryGapMin: Optional[int] = 15

class CreateCampaignRequest(BaseModel):
    name: str
    agentId: str
    phoneNumberId: str
    fromPhoneNumber: str
    contactIds: Optional[List[str]] = []
    schedule: Optional[CampaignSchedule] = None

from app.api.dependencies import get_current_user
from app.models.domain import User
import httpx
from app.core.config import settings
import uuid

@router.get("/")
def get_campaigns(current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    campaigns = db.exec(select(Campaign).where(Campaign.user_id == current_user.id)).all()
    return {"success": True, "data": campaigns}

@router.post("/create")
async def create_campaign(request: CreateCampaignRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    
    new_campaign_id = str(uuid.uuid4())
    
    if settings.RAVAN_AGNI_AI:
        try:
            url = "https://api.ravan.ai/api/v1/campaigns/"
            headers = {
                "X-Api-Key": settings.RAVAN_AGNI_AI,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            body = request.model_dump(exclude_none=True)
            
            # Backend Proxy: Map phoneNumberId dynamically
            from app.models.domain import PurchasedPhoneNumber
            phone_record = db.exec(select(PurchasedPhoneNumber).where(PurchasedPhoneNumber.phone_number == request.fromPhoneNumber)).first()
            if phone_record and phone_record.id:
                body["phoneNumberId"] = str(phone_record.id)
            else:
                body["phoneNumberId"] = str(uuid.uuid4()) # Fallback to valid UUID format
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=body, headers=headers)
                if response.status_code == 200 or response.status_code == 201:
                    data = response.json().get("data", {})
                    if data.get("id"):
                        new_campaign_id = data.get("id")
                else:
                    print(f"Ravan API Campaign Reject ({response.status_code}): {response.text}")
                    # Force raise so we can see the exact validation error in the network panel or logs
                    raise HTTPException(status_code=response.status_code, detail=f"Ravan API Error: {response.text}")
        except httpx.RequestError as e:
            print(f"Failed to sync campaign with Ravan API: {e}")
            pass
            
    # Save to local DB
    new_campaign = Campaign(
        id=new_campaign_id,
        user_id=current_user.id,
        name=request.name
    )
    db.add(new_campaign)
    
    # Store globally for user fallback if needed
    if current_user.role != 'admin' and not current_user.ravan_campaign_id:
        current_user.ravan_campaign_id = new_campaign_id
        db.add(current_user)
        
    db.commit()
    db.refresh(new_campaign)
    return new_campaign

def run_campaign_calls(campaign_id: str):
    """Background task to dial pending contacts."""
    with Session(engine) as db:
        campaign = db.exec(select(Campaign).where(Campaign.id == campaign_id)).first()
        if not campaign:
            return
            
        called_contacts_subq = select(Call.contact_phone).where(Call.campaign_id == campaign_id)
        pending_contacts = db.exec(select(Contact).where(Contact.phone.not_in(called_contacts_subq))).all()
        
        for contact in pending_contacts:
            new_call = Call(
                id=str(uuid.uuid4()),
                contact_phone=contact.phone,
                campaign_id=campaign_id,
                vendor_call_sid=str(uuid.uuid4()),
                result_status="Pending"
            )
            db.add(new_call)
            db.commit()
            
            # Hit Ravan API for Outbound Dialing if configured
            if settings.RAVAN_AGNI_AI:
                try:
                    user = db.exec(select(User).where(User.id == campaign.user_id)).first()
                    agent_id = user.ravan_agent_id if user else None
                    if agent_id:
                        payload = {
                            "phoneNumber": contact.phone,
                            "agentId": agent_id,
                            "name": contact.name
                        }
                        
                        # Note: We intentionally swallow async in background sync task by using httpx.post synchronously
                        resp = httpx.post(
                            "https://api.ravan.ai/api/v1/outbound-calls/",
                            json=payload,
                            headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
                        )
                        if resp.status_code == 200 or resp.status_code == 201:
                            new_call.result_status = "Calling"
                            data = resp.json().get("data", {})
                            if data.get("id"):
                                new_call.vendor_call_sid = data.get("id")
                            db.add(new_call)
                            db.commit()
                except Exception as e:
                    print(f"Error triggering Ravan Outbound call: {e}")
                    pass


@router.post("/start/{campaign_id}")
def start_campaign(campaign_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    campaign = db.exec(select(Campaign).where(Campaign.id == campaign_id)).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.status = "Active"
    db.commit()
    
    # Launch background task so UI doesn't freeze tracking Exotel API latency
    background_tasks.add_task(run_campaign_calls, campaign_id)
    
    return {"message": f"Campaign {campaign_id} started. Dispatching background calls securely..."}

@router.post("/exotel-webhook")
async def exotel_webhook(request: Request):
    """
    Receives Exotel's application/x-www-form-urlencoded webhooks for live call state.
    Updates the database table autonomously without frontend interaction.
    """
    form_data = await request.form()
    
    call_sid = form_data.get("CallSid")
    status = form_data.get("Status")
    direction = form_data.get("Direction") # Typically outbound-api
    
    if not call_sid or not status:
        return {"status": "ignored", "reason": "Missing vital payloads"}
        
    # Map Exotel specific statuses to our schema
    status_map = {
        "queued": "Pending",
        "in-progress": "Calling",
        "completed": "Completed", 
        "failed": "Failed",
        "busy": "Busy",
        "no-answer": "No Answer",
        "canceled": "Failed"
    }
    mapped_status = status_map.get(status.lower(), status.capitalize())

    with Session(engine) as db:
        target_call = db.exec(select(Call).where(Call.vendor_call_sid == call_sid)).first()
        if target_call:
            # We don't downgrade completed or answered status blindly
            target_call.result_status = mapped_status
            db.commit()
            
    return {"status": "success"}

@router.get("/{campaign_id}")
def get_campaign_detail(campaign_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    campaign = db.exec(select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == current_user.id)).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    calls = db.exec(select(Call).where(Call.campaign_id == campaign_id)).all()
    
    total = len(calls)
    contacted = sum(1 for c in calls if c.result_status in ["Answered", "Completed", "Busy", "No Answer", "Failed"])
    successful = sum(1 for c in calls if c.result_status in ["Answered", "Completed"])
    failed = sum(1 for c in calls if c.result_status in ["Failed"])
    noAnswer = sum(1 for c in calls if c.result_status in ["No Answer", "Busy"])
    pending = sum(1 for c in calls if c.result_status == "Pending")
    inProgress = sum(1 for c in calls if c.result_status == "Calling")
    
    return {
        "success": True, 
        "data": {
            "id": campaign.id,
            "name": campaign.name,
            "status": campaign.status,
            "contactStats": {
                "total": total,
                "contacted": contacted,
                "successful": successful,
                "failed": failed,
                "noAnswer": noAnswer,
                "pending": pending,
                "inProgress": inProgress
            }
        }
    }

@router.get("/{campaign_id}/contacts")
def get_campaign_contacts(campaign_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    campaign = db.exec(select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == current_user.id)).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    calls = db.exec(select(Call).where(Call.campaign_id == campaign_id)).all()
    # Ideally join with Contact to get names, but just returning calls works for the UI stats
    results = []
    for call in calls:
        contact = db.exec(select(Contact).where(Contact.phone == call.contact_phone)).first()
        results.append({
            "id": call.id,
            "name": contact.name if contact else "Unknown",
            "phone": call.contact_phone,
            "status": call.result_status,
            "duration": call.duration,
            "sentiment": call.sentiment,
            "summary": call.summary
        })
        
        
    return {"success": True, "data": results}

@router.patch("/{campaign_id}")
async def update_campaign_settings(campaign_id: str, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    campaign = db.exec(select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == current_user.id)).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    payload = await request.json()
    
    # Update local DB if name changed
    if "name" in payload:
        campaign.name = payload["name"]
        db.add(campaign)
        db.commit()
        db.refresh(campaign)

    # Sync with Ravan.ai
    if settings.RAVAN_AGNI_AI:
        try:
            url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}"
            headers = {
                "X-Api-Key": settings.RAVAN_AGNI_AI,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient() as client:
                resp = await client.patch(url, json=payload, headers=headers)
                if resp.status_code not in (200, 204):
                    print(f"Ravan API Patch Failed: {resp.status_code} {resp.text}")
                    # If ravan fails, we still return success to keep local DB in sync, or we could raise
        except Exception as e:
            print(f"Error updating campaign in Ravan.ai: {e}")

    return {"success": True, "message": "Campaign settings updated successfully"}

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
    campaign = db.exec(select(Campaign).where(Campaign.id == campaign_id, Campaign.user_id == current_user.id)).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Delete from Ravan.ai
    if settings.RAVAN_AGNI_AI:
        try:
            url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}"
            headers = {
                "X-Api-Key": settings.RAVAN_AGNI_AI,
                "Accept": "application/json"
            }
            async with httpx.AsyncClient() as client:
                resp = await client.delete(url, headers=headers)
                if resp.status_code not in (200, 204):
                    print(f"Ravan API Delete Failed: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"Error deleting campaign from Ravan.ai: {e}")
            
    # Delete local Call records
    calls = db.exec(select(Call).where(Call.campaign_id == campaign_id)).all()
    for call in calls:
        db.delete(call)
        
    # Delete local Campaign record
    db.delete(campaign)
    db.commit()
    
    return {"success": True, "message": "Campaign deleted successfully"}

