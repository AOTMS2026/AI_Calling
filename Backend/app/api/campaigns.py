from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional

from app.database.connection import get_session
from app.models.domain import Campaign

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

@router.post("/start/{campaign_id}")
def start_campaign(campaign_id: int, db: Session = Depends(get_session)):
    campaign = db.exec(select(Campaign).where(Campaign.id == campaign_id)).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.status = "Active"
    db.commit()
    
    return {"message": f"Campaign {campaign_id} started."}
