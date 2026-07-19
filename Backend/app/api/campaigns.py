from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional

from app.database.connection import get_session, engine
from app.models.domain import Campaign, Contact, Call
from app.services.exotel import exotel_client

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

class CampaignCreateRequest(BaseModel):
    name: str
    prompt: Optional[str] = None
    voice: Optional[str] = None

@router.post("/create")
def create_campaign(request: CampaignCreateRequest, db: Session = Depends(get_session)):
    current_user_id = 1
    new_campaign = Campaign(
        user_id=current_user_id,
        name=request.name,
        prompt=request.prompt,
        voice=request.voice
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign

def run_campaign_calls(campaign_id: int):
    """Background task to dial pending contacts via Exotel"""
    with Session(engine) as db:
        # Fetch all contacts that have NOT been called for this specific campaign
        called_contacts_subq = select(Call.contact_phone).where(Call.campaign_id == campaign_id)
        pending_contacts = db.exec(select(Contact).where(Contact.phone.not_in(called_contacts_subq))).all()
        
        for contact in pending_contacts:
            # Register initial call attempt in database
            new_call = Call(
                contact_phone=contact.phone,
                campaign_id=campaign_id,
                result_status="Calling"
            )
            db.add(new_call)
            db.commit()
            db.refresh(new_call)
            
            # Fire API Request to Exotel backend securely
            result = exotel_client.trigger_outbound_call(contact.phone, campaign_id)
            
            if result.get("success"):
                new_call.vendor_call_sid = result.get("vendor_call_sid")
                new_call.result_status = "Pending" # Awaiting Exotel Webhook
            else:
                new_call.result_status = "Failed" # Immediate logical failure (e.g., bad number)
            
            db.commit()


@router.post("/start/{campaign_id}")
def start_campaign(campaign_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
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
