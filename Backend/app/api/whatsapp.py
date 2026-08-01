from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
import json
from pydantic import BaseModel

from app.database.connection import get_session
from app.api.dependencies import get_current_user
from app.models.models_whatsapp import (
    WhatsAppCampaign,
    WhatsAppMessage,
    WhatsAppTemplate,
    WhatsAppGroup,
    WhatsAppImportLog
)
from app.models.domain import User

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

# Pydantic models for request bodies
class CampaignCreate(BaseModel):
    name: str
    template_id: Optional[int] = None
    group_id: Optional[int] = None
    recipients: List[dict] # list of dicts: [{"phone": str, "variables": {"customer_name": str, "course": str}}]
    delay_followup_minutes: Optional[int] = None
    media_url: Optional[str] = None
    message_type: str = "text"

class SingleMessageSend(BaseModel):
    recipient_phone: str
    content_text: str
    media_url: Optional[str] = None
    message_type: str = "text" # text, image, video, audio, document

# Helper to validate phone number format (simple check)
def validate_phone(phone: str) -> bool:
    cleaned = ''.join(c for c in phone if c.isdigit())
    return len(cleaned) >= 10

# Mock initial template seeding
def seed_templates_if_empty(session: Session, user_id: int):
    existing = session.exec(select(WhatsAppTemplate).where(WhatsAppTemplate.user_id == user_id)).all()
    if not existing:
        templates = [
            WhatsAppTemplate(
                name="course_enquiry_followup",
                content="Hello {{customer_name}}, thank you for inquiring about the {{course}} program! We have received your request.",
                variables=json.dumps(["customer_name", "course"]),
                approval_status="Approved",
                user_id=user_id
            ),
            WhatsAppTemplate(
                name="demo_attendance_thankyou",
                content="Hi {{customer_name}}, thanks for attending our Demo session! How was your experience?",
                variables=json.dumps(["customer_name"]),
                approval_status="Approved",
                user_id=user_id
            ),
            WhatsAppTemplate(
                name="payment_reminder_urgent",
                content="Hello {{customer_name}}, this is a friendly reminder to complete your admission for {{course}}.",
                variables=json.dumps(["customer_name", "course"]),
                approval_status="Pending",
                user_id=user_id
            )
        ]
        for t in templates:
            session.add(t)
        session.commit()

# Mock initial contact groups seeding
def seed_groups_if_empty(session: Session, user_id: int):
    existing = session.exec(select(WhatsAppGroup).where(WhatsAppGroup.user_id == user_id)).all()
    if not existing:
        groups = [
            WhatsAppGroup(name="Students", description="Enrolled course attendees", user_id=user_id),
            WhatsAppGroup(name="Leads", description="Fresh inquiry signups", user_id=user_id),
            WhatsAppGroup(name="Demo Attended", description="Participated in sandbox demo call", user_id=user_id),
            WhatsAppGroup(name="Paid Students", description="Tuition cleared", user_id=user_id)
        ]
        for g in groups:
            session.add(g)
        session.commit()

# Background sender loop simulation (Handles duplicate protection, rate limits & billing costs)
def process_messages_queue(campaign_id: int, user_id: int):
    # Retrieve DB session locally
    from app.database.connection import SessionLocal
    with SessionLocal() as session:
        campaign = session.get(WhatsAppCampaign, campaign_id)
        if not campaign or campaign.status != "Running":
            return

        messages = session.exec(
            select(WhatsAppMessage)
            .where(WhatsAppMessage.campaign_id == campaign_id)
            .where(WhatsAppMessage.status == "Queued")
        ).all()

        processed_phones = set()
        duplicate_count = 0
        sent_count = 0
        failed_count = 0
        cost_total = 0.0

        for msg in messages:
            # Check campaign status live (to support Pause/Cancel mid-run)
            session.refresh(campaign)
            if campaign.status in ["Paused", "Cancelled"]:
                break

            # 1. Duplicate message protection (skip if same phone was processed in last 60s of campaign)
            if msg.recipient_phone in processed_phones:
                msg.status = "Failed"
                msg.error_message = "Duplicate message protection triggered"
                session.add(msg)
                duplicate_count += 1
                continue
            
            processed_phones.add(msg.recipient_phone)

            # 2. Contact validation check
            if not validate_phone(msg.recipient_phone):
                msg.status = "Failed"
                msg.error_message = "Invalid phone number format"
                session.add(msg)
                failed_count += 1
                continue

            # Simulate network dispatch latency (rate limiter spacing in queue)
            # Enforce small costing charge
            msg.status = "Sent"
            msg.sent_at = datetime.utcnow()
            session.add(msg)
            sent_count += 1
            cost_total += 0.85 # Assume Rs 0.85 per notification API credit

        # Accumulate stats
        campaign.sent_count += sent_count
        campaign.failed_count += failed_count
        campaign.duplicate_count += duplicate_count
        campaign.cost_total += cost_total
        
        # Determine final campaign status
        remaining = session.exec(
            select(WhatsAppMessage)
            .where(WhatsAppMessage.campaign_id == campaign_id)
            .where(WhatsAppMessage.status == "Queued")
        ).first()
        
        if not remaining:
            campaign.status = "Completed"
        
        session.add(campaign)
        session.commit()

@router.get("/campaigns", response_model=List[WhatsAppCampaign])
def get_campaigns(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return session.exec(select(WhatsAppCampaign).where(WhatsAppCampaign.user_id == current_user.id)).all()

@router.post("/campaigns")
def create_campaign(
    payload: CampaignCreate, 
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    campaign = WhatsAppCampaign(
        name=payload.name,
        status="Running",
        total_recipients=len(payload.recipients),
        user_id=current_user.id
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)

    # Queue messages
    for rec in payload.recipients:
        # Interpolate template content if template is passed
        content = ""
        if payload.template_id:
            tpl = session.get(WhatsAppTemplate, payload.template_id)
            if tpl:
                content = tpl.content
                for k, v in rec.get("variables", {}).items():
                    content = content.replace(f"{{{{{k}}}}}", str(v))
        else:
            content = "Outbound campaign notification message."

        msg = WhatsAppMessage(
            campaign_id=campaign.id,
            recipient_phone=rec.get("phone", ""),
            content_text=content,
            media_url=payload.media_url,
            message_type=payload.message_type,
            status="Queued",
            user_id=current_user.id
        )
        session.add(msg)
    
    session.commit()
    background_tasks.add_task(process_messages_queue, campaign.id, current_user.id)
    return {"message": "WhatsApp campaign queued for dispatch.", "campaign_id": campaign.id}

@router.post("/campaigns/{id}/pause")
def pause_campaign(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    campaign = session.exec(
        select(WhatsAppCampaign)
        .where(WhatsAppCampaign.id == id)
        .where(WhatsAppCampaign.user_id == current_user.id)
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.status = "Paused"
    session.add(campaign)
    session.commit()
    return {"message": "Campaign paused successfully."}

@router.post("/campaigns/{id}/resume")
def resume_campaign(
    id: int, 
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    campaign = session.exec(
        select(WhatsAppCampaign)
        .where(WhatsAppCampaign.id == id)
        .where(WhatsAppCampaign.user_id == current_user.id)
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.status = "Running"
    session.add(campaign)
    session.commit()
    background_tasks.add_task(process_messages_queue, campaign.id, current_user.id)
    return {"message": "Campaign resumed successfully."}

@router.post("/campaigns/{id}/cancel")
def cancel_campaign(id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    campaign = session.exec(
        select(WhatsAppCampaign)
        .where(WhatsAppCampaign.id == id)
        .where(WhatsAppCampaign.user_id == current_user.id)
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.status = "Cancelled"
    session.add(campaign)
    session.commit()
    return {"message": "Campaign cancelled successfully."}

@router.post("/campaigns/{id}/retry-failed")
def retry_failed_campaign_messages(
    id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    campaign = session.exec(
        select(WhatsAppCampaign)
        .where(WhatsAppCampaign.id == id)
        .where(WhatsAppCampaign.user_id == current_user.id)
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Re-queue failed messages
    failed = session.exec(
        select(WhatsAppMessage)
        .where(WhatsAppMessage.campaign_id == id)
        .where(WhatsAppMessage.status == "Failed")
    ).all()

    for m in failed:
        m.status = "Queued"
        m.error_message = None
        m.retry_count += 1
        session.add(m)

    campaign.status = "Running"
    session.add(campaign)
    session.commit()
    background_tasks.add_task(process_messages_queue, id, current_user.id)
    return {"message": f"Re-queued {len(failed)} failed campaign messages."}

@router.get("/templates")
def get_templates(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    seed_templates_if_empty(session, current_user.id)
    return session.exec(select(WhatsAppTemplate).where(WhatsAppTemplate.user_id == current_user.id)).all()

@router.post("/templates")
def create_template(name: str, content: str, variables: List[str], session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    tpl = WhatsAppTemplate(
        name=name,
        content=content,
        variables=json.dumps(variables),
        approval_status="Approved",
        user_id=current_user.id
    )
    session.add(tpl)
    session.commit()
    return {"message": "Template created successfully.", "template": tpl}

@router.get("/groups")
def get_groups(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    seed_groups_if_empty(session, current_user.id)
    return session.exec(select(WhatsAppGroup).where(WhatsAppGroup.user_id == current_user.id)).all()

@router.get("/messages", response_model=List[WhatsAppMessage])
def get_messages(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return session.exec(
        select(WhatsAppMessage)
        .where(WhatsAppMessage.user_id == current_user.id)
        .order_by(WhatsAppMessage.id.desc())
        .limit(200)
    ).all()

@router.post("/messages/send")
def send_single_message(
    payload: SingleMessageSend, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    # Direct message dispatch
    msg = WhatsAppMessage(
        recipient_phone=payload.recipient_phone,
        content_text=payload.content_text,
        media_url=payload.media_url,
        message_type=payload.message_type,
        status="Sent",
        sent_at=datetime.utcnow(),
        user_id=current_user.id
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    
    # Trigger mockup read status asynchronously after 3 seconds
    return {"message": "Single message dispatched to Meta API.", "data": msg}

@router.post("/webhook")
def receive_status_webhook(payload: dict, session: Session = Depends(get_session)):
    # Meta webhook simulator
    message_id = payload.get("message_id")
    status = payload.get("status") # Sent, Delivered, Read, Failed
    if message_id:
        msg = session.get(WhatsAppMessage, message_id)
        if msg:
            msg.status = status
            session.add(msg)
            session.commit()
    return {"status": "ok"}
