import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.domain import User

router = APIRouter(prefix="/tools", tags=["tools"])

RAVAN_TOOLS_URL = "https://api.ravan.ai/api/v1/tools"

@router.get("/")
async def get_tools(agent_id: str, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        return {"data": []}
        
    async with httpx.AsyncClient() as client:
        try:
            # Ravan API usually expects camelCase parameters
            url = f"{RAVAN_TOOLS_URL}/?agentId={agent_id}"
            response = await client.get(
                url,
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            # Silently return empty list if Ravan fails, so frontend doesn't crash
            return {"data": []}

@router.post("/")
async def create_tool(request_data: dict, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured.")
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{RAVAN_TOOLS_URL}/",
                json=request_data,
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{tool_id}")
async def update_tool(tool_id: str, request_data: dict, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured.")
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.patch(
                f"{RAVAN_TOOLS_URL}/{tool_id}/",
                json=request_data,
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tool_id}")
async def delete_tool(tool_id: str, current_user: User = Depends(get_current_user)):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured.")
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{RAVAN_TOOLS_URL}/{tool_id}/",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            return {"success": True}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
