import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import settings
from dotenv import load_dotenv

router = APIRouter(prefix="/api/ravan", tags=["ravan"])

@router.get("/organization")
async def get_ravan_organization():
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing in environment variables.")

    url = "https://api.ravan.ai/api/v1/organizations/profile/cf5018d8-8f14-49ac-ad70-910f0efcb67b"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            # Log the complete JSON response in the backend console for debugging. (Requirement 13)
            # Also log success (Requirement 15)
            if response.status_code == 200:
                print("Ravan API Connected Successfully")
                print("Ravan JSON Profile:", response.json())
                return response.json()
            elif response.status_code == 401:
                """401, 403, 404, 500 error handling (Requirement 12)"""
                print("Ravan JSON Error (401):", response.text)
                raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key provided.")
            elif response.status_code == 403:
                print("Ravan JSON Error (403):", response.text)
                raise HTTPException(status_code=403, detail="Forbidden: Your API Key does not have permission to view this organization.")
            elif response.status_code == 404:
                print("Ravan JSON Error (404):", response.text)
                raise HTTPException(status_code=404, detail="Not Found: The specified organization ID was not found.")
            elif response.status_code >= 500:
                print("Ravan JSON Error (500):", response.text)
                raise HTTPException(status_code=500, detail="Internal Server Error: Ravan API is currently down.")
            else:
                response.raise_for_status()

        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Failed to communicate with Ravan.ai: {str(e)}")

@router.get("/tools/{tool_id}")
async def get_ravan_tool(tool_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/tools/{tool_id}"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                # Log error
                print(f"Ravan Tool Fetch Error ({response.status_code}):", response.text)
                # If Ravan is returning a 403 or 401 we still want to gracefully mock or raise so UI isn't broken
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch tool: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching tool from Ravan: {str(e)}")

@router.get("/tools")
async def list_ravan_tools(
    limit: int = 20,
    offset: int = 0,
    agent_id: str = None
):
    """
    Fetch a list of tools optionally filtered by agent_id.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/tools/"
    params = {
        "limit": limit,
        "offset": offset
    }
    
    if agent_id:
        # Binding both agent_id and agentId as seen in documentation payload request
        params["agentId"] = agent_id
        params["agent_id"] = agent_id

    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Tools List Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch tools list: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching tools list from Ravan: {str(e)}")

@router.get("/phone-numbers/available-numbers/{iso_country}")
async def get_available_numbers(
    iso_country: str,
    page_size: int = 10,
    region: str = None
):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/phone-numbers/available-numbers/{iso_country}/"
    params = {
        "page_size": page_size
    }
    if region:
        params["region"] = region

    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Phone Numbers Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch phone numbers: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching phone numbers from Ravan: {str(e)}")


class BuyNumberRequest(BaseModel):
    phone_number: str
    price: float
    per_minute_price_inbound: float
    per_minute_price_outbound: float

@router.post("/phone-numbers/buy")
async def buy_phone_number(payload: BuyNumberRequest):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/phone-numbers/buy/"
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload.model_dump(), headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Buy Number Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to buy phone number: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error buying phone number from Ravan: {str(e)}")


@router.get("/campaigns")
async def get_outbound_campaigns(limit: int = 100, offset: int = 0):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/campaigns/"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    params = {
        "limit": limit,
        "offset": offset
    }

    async with httpx.AsyncClient() as client:
        try:
            # Force a fresh read of .env to ensure any live updates instantly override python memory
            load_dotenv(override=True)
            
            # Explicit User Override: Force physical isolation of the exact .env CAMPAIGN_ID above all
            env_campaign_id = os.environ.get("CAMPAIGN_ID") or os.environ.get("CAMPAIGNS")
            if env_campaign_id:
                isolated_url = f"https://api.ravan.ai/api/v1/campaigns/{env_campaign_id}"
                isolated_res = await client.get(isolated_url, headers=headers)
                if isolated_res.status_code == 200:
                    isolated_data = isolated_res.json()
                    if "data" in isolated_data:
                        return {"success": True, "data": [isolated_data["data"]]}
            
            # If no manual override exists in .env, natively query the global Ravan array
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data.get("data") and len(data.get("data", [])) > 0:
                    return data
            
            # If everything completely fails and no fallback worked
            print(f"Ravan Campaigns Fetch Error ({response.status_code}):", response.text)
            raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch campaigns")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching campaigns from Ravan: {str(e)}")

@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Campaign Fetch Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching campaign from Ravan: {str(e)}")


@router.post("/campaigns/{campaign_id}/start")
async def start_campaign(campaign_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts?campaignId={campaign_id}"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Campaign Start Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to start campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error starting campaign from Ravan: {str(e)}")

@router.post("/campaigns/{campaign_id}/pause")
async def pause_campaign(campaign_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}/pause"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Campaign Pause Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to pause campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error pausing campaign from Ravan: {str(e)}")

@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Campaign Delete Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to delete campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error deleting campaign from Ravan: {str(e)}")

@router.get("/campaigns/{campaign_id}/contacts")
async def get_campaign_contacts(campaign_id: str, limit: int = 500, offset: int = 0):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/contacts"
    params = {
        "campaignId": campaign_id,
        "limit": limit,
        "offset": offset
    }
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Campaign Contacts Fetch Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch campaign contacts: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching campaign contacts from Ravan: {str(e)}")

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

@router.post("/campaigns/create")
async def create_campaign(payload: CreateCampaignRequest):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/campaigns/"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # Format explicitly removing Nones if Ravan strictly prohibits them
    body = payload.model_dump(exclude_none=True)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=body, headers=headers)
            if response.status_code == 200 or response.status_code == 201:
                return response.json()
            else:
                print(f"Ravan Campaigns Create Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to create campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error creating campaign on Ravan: {str(e)}")

@router.get("/contacts")
async def get_all_contacts(limit: int = 100, offset: int = 0):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/contacts/"
    params = {
        "limit": limit,
        "offset": offset
    }
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Global Contacts Fetch Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch global contacts: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching global contacts from Ravan: {str(e)}")


