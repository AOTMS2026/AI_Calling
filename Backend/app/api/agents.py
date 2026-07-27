import httpx
from fastapi import APIRouter, HTTPException, Query, Depends, Request
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.domain import User
from app.database.connection import get_session
from sqlmodel import Session

router = APIRouter(prefix="/agents", tags=["agents"])

# Ensure we always strip trailing slashes internally, as ravan uses strict trailing slashes on some endpoints
from fastapi import Query

@router.get("/")
async def list_agents(
    limit: int = Query(10, description="Number of results to return"), 
    offset: int = Query(0, description="Pagination offset"),
    current_user: User = Depends(get_current_user)
):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    async with httpx.AsyncClient() as client:
        try:
            # Multi-Tenant Core Validation Strategy
            if current_user.role == "admin":
                # Admins can query the entire fleet array natively
                response = await client.get(
                    f"https://api.ravan.ai/api/v1/agents/?limit={limit}&offset={offset}",
                    headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
                )
                response.raise_for_status()
                return response.json()
            else:
                # Customer accounts MUST be strictly physically locked to their assigned UUID
                if not current_user.ravan_agent_id:
                    # User is completely unassigned; returning an empty array struct to prevent crashes
                    return {"success": True, "message": "No agent assigned to customer", "data": [], "meta": {"total": "0"}}
                
                # Fetch only this rigidly secured UUID
                response = await client.get(
                    f"https://api.ravan.ai/api/v1/agents/{current_user.ravan_agent_id}/",
                    headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
                )
                response.raise_for_status()
                payload = response.json()
                
                # We structurally wrap the individual nested object in an array mapping block 
                # so the frontend Maps engine accurately iterators over it.
                agent_data = payload.get("data", payload)
                return {"success": True, "message": "Assigned payload securely transferred", "data": [agent_data], "meta": {"total": "1", "limit": 1, "offset": 0}}
            
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_agent(
    request_data: dict, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Provisions a net-new agent securely in Ravan, and natively attaches the Master UUID to the user's relational model.
    """
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    # Prevent assigning multiple agents if AOTMS only supports 1 node natively per customer
    if current_user.role != 'admin' and current_user.ravan_agent_id:
        raise HTTPException(status_code=400, detail="Customer already has an active agent mapped. Delete it before provisioning a new one.")

    async with httpx.AsyncClient() as client:
        try:
            # --- Dynamic Node Telemetry Validation ---
            # Ravan API explicitly rejects internal UUIDs. We must rigorously enforce Text-Literal fallbacks!
            dynamic_model = "Agni Premium"
            dynamic_voice = "Iris"

            # We must explicitly build the massive exhaustive payload for Ravan compliance dynamically.
            raw_payload = {
                "organizationId": request_data.get("organizationId"),
                "agentName": request_data.get("agentName", "Unnamed Agent"),
                "status": request_data.get("status", "ACTIVE"),
                "model": request_data.get("model", dynamic_model),
                "s2sModel": request_data.get("s2sModel", dynamic_model),
                "voiceId": request_data.get("voiceId", dynamic_voice),
                "temperature": request_data.get("temperature", 0.7),
                "reminderTriggerMs": request_data.get("reminderTriggerMs", 10000),
                "reminderMaxCount": request_data.get("reminderMaxCount", 2),
                "reminderMessage": request_data.get("reminderMessage", "Hello, are you still there?"),
                "ambientSound": request_data.get("ambientSound"),
                "ambientSoundVolume": request_data.get("ambientSoundVolume", 1.0),
                "maxCallDurationMs": request_data.get("maxCallDurationMs", 600000), # 10 Minutes
                "ringDurationMs": request_data.get("ringDurationMs", 32000), # 32 Secs
                "voicemailMessage": request_data.get("voicemailMessage", ""),
                "voicemailDetectionTimeoutMs": request_data.get("voicemailDetectionTimeoutMs", 7000),
                "voicemailCustomPatterns": request_data.get("voicemailCustomPatterns"),
                "postCallAnalysisModel": request_data.get("postCallAnalysisModel", "gpt-4o-mini"), 
                "postCallAnalysisData": request_data.get("postCallAnalysisData"),
                "selectedTools": request_data.get("selectedTools"),
                "knowledgeBase": request_data.get("knowledgeBase"),
                "beginMessage": request_data.get("beginMessage", "Hello, how can I help you?"),
                "startSpeaker": request_data.get("startSpeaker", "agent"),
                "prompt": request_data.get("prompt", "You are a helpful AI Assistant."),
                "webhookUrls": request_data.get("webhookUrls"),
                "endcallOnSilenceDuration": request_data.get("endcallOnSilenceDuration", 10000),
                "interruptionSensitivity": request_data.get("interruptionSensitivity", 0.1),
                "memory": request_data.get("memory", True),
                "calendarTimezone": request_data.get("calendarTimezone", "Asia/Calcutta"),
                "accent": request_data.get("accent"),
                "emotion": request_data.get("emotion", True),
                "salesforceCalendarId": request_data.get("salesforceCalendarId"),
                "emergencyFallback": request_data.get("emergencyFallback")
            }
            
            # Structurally wipe None values to prevent Ravan Strict-Mode Rejection mapping
            payload = {k: v for k, v in raw_payload.items() if v is not None}

            response = await client.post(
                "https://api.ravan.ai/api/v1/agents/",
                json=payload,
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            response_json = response.json()
            
            # The newly created Ravan UUID
            new_agent_id = response_json.get("data", {}).get("id")
            
            # Autowire this directly back down into PostgreSQL for the customer (if not admin)
            if current_user.role != 'admin' and new_agent_id:
                current_user.ravan_agent_id = new_agent_id
                db.commit()
                
            return response_json
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan AI Provisioning Reject: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/voices")
async def get_available_voices():
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.ravan.ai/api/v1/available-llm-models/with-voices?limit=100&offset=0",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    async with httpx.AsyncClient() as client:
        try:
            # Trailing slash is explicitly required by Ravan's specification for UUID lookups
            response = await client.get(
                f"https://api.ravan.ai/api/v1/agents/{agent_id}/",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str,
    db: Session = Depends(get_session)
):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    async with httpx.AsyncClient() as client:
        try:
            # Trailing slash is explicitly required by Ravan's specification for UUID lookups
            response = await client.delete(
                f"https://api.ravan.ai/api/v1/agents/{agent_id}/",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            
            # Wipe the mapped ID from the Database so the Customer can provision a new node safely
            from sqlmodel import select
            user_holding_node = db.exec(select(User).where(User.ravan_agent_id == agent_id)).first()
            if user_holding_node:
                user_holding_node.ravan_agent_id = None
                db.add(user_holding_node)
                db.commit()
                
            # The API returns a success message
            return {"success": True, "message": f"Agent {agent_id} obliterated successfully."}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{agent_id}")
async def update_agent(agent_id: str, request_data: dict):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.patch(
                f"https://api.ravan.ai/api/v1/agents/{agent_id}/",
                json=request_data,
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return {"success": True, "status": request_data.get("status", "ACTIVE")}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
