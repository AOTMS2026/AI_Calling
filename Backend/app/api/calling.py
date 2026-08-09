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
            
            if response.status_code == 404:
                return {
                    "success": True,
                    "data": {
                        "recording_url": "",
                        "transcripts": [{"role": "bot", "content": "Call not found in Ravan.ai or still pending."}],
                        "cost_total": 0.0,
                        "credit_breakdown": {}
                    }
                }
                
            response.raise_for_status()
            r_data = response.json().get("data", {})
            
            # Map Ravan API response to AOTMS expected format
            transcripts = []
            raw_transcript = r_data.get("transcript") or r_data.get("transcripts") or []
            
            if isinstance(raw_transcript, list):
                for item in raw_transcript:
                    if "message" in item and isinstance(item["message"], dict):
                        # Handle nested {message: {role, content}} format
                        transcripts.append({
                            "role": item["message"].get("role", "bot"),
                            "content": item["message"].get("content", ""),
                            "text": item["message"].get("content", "")
                        })
                    else:
                        # Handle flat {role, content} format
                        transcripts.append(item)
            elif isinstance(raw_transcript, str):
                # Try to parse string transcript if it's formatted like "User: Hello\nAI: Hi"
                lines = raw_transcript.split('\n')
                for line in lines:
                    if ':' in line:
                        role, text = line.split(':', 1)
                        r = 'user' if 'user' in role.lower() or 'human' in role.lower() else 'bot'
                        transcripts.append({"role": r, "content": text.strip(), "text": text.strip()})
                    else:
                        transcripts.append({"role": "bot", "content": line, "text": line})
                        
            return {
                "success": True,
                "data": {
                    "recording_url": r_data.get("recording_url", r_data.get("recordingUrl", "")),
                    "transcripts": transcripts,
                    "cost_total": r_data.get("cost_total", r_data.get("cost", 0.0)),
                    "credit_breakdown": r_data.get("credit_breakdown", {})
                }
            }
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/phone-history")
async def get_phone_history(request: Request, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        return {"data": []}
        
    async with httpx.AsyncClient() as client:
        try:
            # Forward all query parameters like phone, page, etc.
            response = await client.get(
                f"{RAVAN_CALLING_URL}/phone-history",
                params=dict(request.query_params),
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            data = response.json()
            
            # Map transcripts for UI compatibility
            if "calls" in data:
                for call in data["calls"]:
                    if "transcripts" in call and isinstance(call["transcripts"], list):
                        flat_transcripts = []
                        for item in call["transcripts"]:
                            if "message" in item and isinstance(item["message"], dict):
                                flat_transcripts.append({
                                    "role": item["message"].get("role", "bot"),
                                    "content": item["message"].get("content", ""),
                                    "text": item["message"].get("content", "")
                                })
                            else:
                                flat_transcripts.append(item)
                        call["transcripts"] = flat_transcripts
                        
            return data
        except Exception as e:
            print(f"Error fetching phone-history: {e}")
            return {"data": []}

@router.get("/audio-stream")
async def get_audio_stream(url: str):
    """Securely buffer and stream recording audio to the frontend audio player to bypass CORS."""
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured.")
        
    async def stream_generator():
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                async with client.stream("GET", url, headers={"X-Api-Key": settings.RAVAN_AGNI_AI}) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        yield chunk
            except Exception as e:
                # If streaming fails, yield nothing
                pass
                
    return StreamingResponse(stream_generator(), media_type="audio/mpeg")
