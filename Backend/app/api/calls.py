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
    if not settings.RAVAN_AGNI_AI or not settings.AGENT_ID:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI or AGENT_ID missing from backend config.")
    
    # Ravan Outbound Call Payload
    payload = {
        "agentId": settings.AGENT_ID,
        "customerNumber": call_req.phone_number,
        "metadata": {
            "name": call_req.contact_name
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://api.ravan.ai/api/v1/calls/",
                json=payload,
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            resp.raise_for_status()
            response_data = resp.json()
            
            # Immediately instantiate the Call Record in AOTMS Database
            new_call = Call(
                contact_id=1,  # Default fallback contact id
                campaign_id=1,
                vendor_call_sid=response_data.get("data", {}).get("id") or response_data.get("id"),
                status="ringing"
            )
            db.add(new_call)
            db.commit()
            
            return {"success": True, "call_id": new_call.vendor_call_sid}
            
        except httpx.HTTPError as e:
            raise HTTPException(status_code=e.response.status_code if hasattr(e, "response") else 500, detail=str(e))

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
            
    print(f"WEBHOOK INTERCEPTED -> Call SID {call_sid} | Analysis Parsed!")
    return {"message": "Webhook absorbed successfully."}
