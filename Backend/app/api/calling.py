import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import Optional
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.domain import User

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
async def get_call_sessions(page_size: int = 50, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        return {"data": []}
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{RAVAN_CALLING_URL}/call-sessions?page_size={page_size}",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
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
