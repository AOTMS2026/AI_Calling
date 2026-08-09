import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import Optional
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.domain import User
from sqlmodel import Session
from app.database.connection import get_session

router = APIRouter(prefix="/calling", tags=["calling"])

RAVAN_CALLING_URL = "https://api.ravan.ai/api/v1/calling"

@router.post("/create-call")
async def create_call(request_data: dict, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured.")
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{RAVAN_CALLING_URL}/create-call",
                json=request_data,
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/finalize-session/{session_id}")
async def finalize_session(session_id: str, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured.")
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{RAVAN_CALLING_URL}/finalize-session/{session_id}",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/call-sessions")
async def get_call_sessions(
    page_size: int = 50, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if not settings.RAVAN_AGNI_AI:
        return {"data": []}
        
    # Get user's assigned agents
    agent_uuids = set()
    if current_user.role != 'admin':
        from sqlmodel import select
        from app.models.domain import Assign_Agents
        assigned_records = db.exec(select(Assign_Agents.agent_id).where(Assign_Agents.user_id == current_user.id)).all()
        agent_uuids = set(assigned_records)
        if current_user.ravan_agent_id:
            agent_uuids.add(current_user.ravan_agent_id)
            
        if not agent_uuids:
            return {"data": []}
            
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{RAVAN_CALLING_URL}/call-sessions?page_size={page_size}",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            res_json = response.json()
            
            if current_user.role != 'admin':
                # Filter call sessions by agent_id
                data_obj = res_json.get("data", {})
                if isinstance(data_obj, dict):
                    call_sessions = data_obj.get("callSessions", [])
                    filtered = [c for c in call_sessions if c.get("agentId") in agent_uuids or c.get("agent_id") in agent_uuids]
                    res_json["data"]["callSessions"] = filtered
                    res_json["data"]["totalCount"] = len(filtered)
                elif isinstance(data_obj, list):
                    filtered = [c for c in data_obj if c.get("agentId") in agent_uuids or c.get("agent_id") in agent_uuids]
                    res_json["data"] = filtered
                    
            return res_json
        except Exception as e:
            print(f"Error fetching call sessions: {e}")
            return {"data": []}

@router.get("/call-sessions-detail/{session_id}")
async def get_call_session_detail(session_id: str, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured.")
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{RAVAN_CALLING_URL}/call-sessions-detail/{session_id}",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/phone-history")
async def get_phone_history(current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        return {"data": []}
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{RAVAN_CALLING_URL}/phone-history",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"data": []}

@router.get("/audio-stream")
async def get_audio_stream(url: str):
    """Securely buffer and stream recording audio to the frontend audio player to bypass CORS."""
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured.")
        
    async def stream_generator():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("GET", url, headers={"X-Api-Key": settings.RAVAN_AGNI_AI}) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        yield chunk
            except Exception as e:
                # If streaming fails, yield nothing
                pass
                
    return StreamingResponse(stream_generator(), media_type="audio/mpeg")
