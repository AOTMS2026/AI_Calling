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


@router.post("/calling/create-call")
async def proxy_create_call_session(payload: dict):
    """
    Proxies outbound or web call initialization requests seamlessly safely abstracting X-Api-Key keys securely.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    url = f"https://api.ravan.ai/api/v1/calling/create-call"
    headers = {
        "X-Api-Key": api_key,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code not in (200, 201):
                error_body = res.text
                print("Ravan API Execution Block Failure:", error_body)
                raise HTTPException(status_code=res.status_code, detail=f"Proxy blocked mapping sandbox web_call. Ravan rejected payload with code {res.status_code}: {error_body}")
            return res.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network bridge timeout mapping websocket token request block: {str(e)}")

import asyncio
@router.get("/campaigns/{campaign_id}/cost-aggregation")
async def get_campaign_total_cost(campaign_id: str):
    """
    Rapid async proxy engine gracefully extracting precise cost mapping across all bound campaign contacts natively.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    headers = {"X-Api-Key": api_key, "Accept": "application/json"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 1. Fetch Master Array
            contacts_url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}/contacts?limit=500"
            res = await client.get(contacts_url, headers=headers)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail="Failed to fetch campaign contacts")
                
            contacts = res.json().get("data", [])
            
            # 2. Build High-Speed Async Traversal Queue
            async def fetch_detail_cost(contact_id: str):
                detail_url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}/detail"
                try:
                    c_res = await client.get(detail_url, headers=headers)
                    if c_res.status_code == 200:
                        c_data = c_res.json().get("data", {})
                        recent_calls = c_data.get("recentCalls", [])
                        total_secs = sum([float(rc.get("duration") or rc.get("durationIdSec") or rc.get("duration_sec") or rc.get("callDurationSec") or 0) for rc in recent_calls])
                        return total_secs / 60.0
                except Exception:
                    pass
                return 0.0

            # 3. Fire all requests concurrently!
            tasks = [fetch_detail_cost(c.get("id")) for c in contacts if c.get("id")]
            results = await asyncio.gather(*tasks)
            
            total_credits = sum(results)
            return {"campaign_id": campaign_id, "contact_count": len(contacts), "total_cost": total_credits}
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Async network error aggregating costs: {str(e)}")

@router.get("/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics(campaign_id: str):
    """
    Additional Method: Fetch complete metrics exclusively off original data based on campaign id.
    Computes total minutes, true success rate, dynamic conversions, and daily channel plotting securely.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    headers = {"X-Api-Key": api_key, "Accept": "application/json"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 1. Fetch Campaign natively to extract its mapped agentId target wrapper
            camp_res = await client.get(f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}", headers=headers)
            if camp_res.status_code != 200:
                raise HTTPException(status_code=camp_res.status_code, detail="Failed to retrieve root campaign mapping definition from Ravan.")
            
            camp_data = camp_res.json().get("data", {})
            agent_id = camp_data.get("agentId")
            
            # 2. Fetch Sessions explicitly mapping original metrics!
            sess_url = f"https://api.ravan.ai/api/v1/calling/call-sessions?limit=5000"
            if agent_id:
                sess_url += f"&agentId={agent_id}"
                
            sess_res = await client.get(sess_url, headers=headers)
            if sess_res.status_code != 200:
                raise HTTPException(status_code=sess_res.status_code, detail="Failed to fetch call sessions.")
                
            sessions_parent = sess_res.json().get("data", {})
            sessions = sessions_parent.get("callSessions", []) if type(sessions_parent) is dict else sessions_parent
            
            # Map metrics struct dynamically!
            import datetime
            now_iso = datetime.datetime.now().isoformat().split('T')[0]
            
            # Extract true metrics explicitly mapped strictly bounding this specific Campaign ID instance! 
            contact_stats = camp_data.get("contactStats", {})
            total_calls = contact_stats.get("total", 0)
            success_calls = contact_stats.get("successful", 0)
            failed_calls = contact_stats.get("failed", 0) + contact_stats.get("noAnswer", 0)
            
            live_calls = contact_stats.get("pending", 0) + contact_stats.get("inProgress", 0)
            success_rate = round((success_calls / max(total_calls, 1)) * 100)
            
            total_duration_sec = 0
            channels_today = {"outbound": 0, "inbound": 0, "web": 0}
            hourly_map = [0] * 24
            
            # 12-point arrays mapped natively into Dashboard trending logic (summing duration in minutes)
            usage_day = [0] * 12
            usage_week = [0] * 7
            usage_month = [0] * 10
            
            now_dt = datetime.datetime.now().astimezone()
            
            for s in sessions:
                # Accumulate actual native duration bound to Agent usage footprint
                dur_sec = float(s.get("durationSec") or s.get("durationIdSec") or s.get("duration_sec") or 0)
                total_duration_sec += dur_sec
                
                created = str(s.get("startedAt") or "")
                
                # Check timezone safely natively isolating parsing errors
                is_today = False
                try:
                    if created:
                        local_dt = datetime.datetime.fromisoformat(created.replace('Z', '+00:00')).astimezone()
                        local_iso = local_dt.strftime('%Y-%m-%d')
                        dur_min = dur_sec / 60.0
                        
                        # Process 24-hour exact today map
                        if local_iso == now_iso:
                            is_today = True
                            local_hour = local_dt.hour
                            hourly_map[local_hour] += 1
                            usage_day[local_hour // 2] += dur_min
                            
                        # Process Weekly Offsets (7 bars)
                        day_offset = (now_dt - local_dt).days
                        if 0 <= day_offset < 7:
                            usage_week[6 - day_offset] += dur_min
                            
                        # Process Monthly Offsets (10 bars of 3 days)
                        chunk = day_offset // 3
                        if 0 <= chunk < 10:
                            usage_month[9 - chunk] += dur_min
                            
                except Exception:
                    pass
                
                if is_today:
                    direction = str(s.get("channel", "")).lower()
                    if "outbound" in direction: channels_today["outbound"] += 1
                    elif "inbound" in direction: channels_today["inbound"] += 1
                    else: channels_today["web"] += 1
                        
            # Format duration natively as MM.SS (e.g. 0.48 for 48 seconds, 1.05 for 65 seconds)
            total_duration_int = int(total_duration_sec)
            mm = total_duration_int // 60
            ss = total_duration_int % 60
            total_minutes = float(f"{mm}.{ss:02d}")
            
            return {
                "success": True,
                "data": {
                    "total_minutes": total_minutes,
                    "total_seconds": total_duration_int,
                    "live_calls": live_calls,
                    "success_rate": success_rate,
                    "conversion": success_rate, # Mirror conversion logic from success rate explicitly
                    "total_calls": total_calls,
                    "failed_calls": failed_calls,
                    "today_activity": channels_today,
                    "hourly_map": hourly_map,
                    "usage_day": usage_day,
                    "usage_week": usage_week,
                    "usage_month": usage_month
                }
            }
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network bridge broken tracking campaign metrics: {str(e)}")





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

    # Force param injection natively into URL string because Ravan drops dictionary query params
    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}/contacts?limit={limit}&offset={offset}"
    params = {}
    
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

import urllib.parse

@router.get("/contacts")
async def get_global_contacts(limit: int = 5000, offset: int = 0, search: Optional[str] = None, campaign_id: Optional[str] = None):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    # Force fresh read of .env to ensure live override
    from dotenv import load_dotenv
    load_dotenv(override=True)
    env_campaign_id = campaign_id or os.environ.get("CAMPAIGN_ID") or os.environ.get("CAMPAIGNS")

    base_url = f"https://api.ravan.ai/api/v1/campaigns/{env_campaign_id}/contacts" if env_campaign_id else "https://api.ravan.ai/api/v1/contacts"
    url = f"{base_url}?limit={limit}&offset={offset}"
    
    if search:
        safe_search = urllib.parse.quote(search)
        url += f"&search={safe_search}"
        
    params = {}
    
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

@router.get("/contacts/{contact_id}/detail")
async def get_contact_detail(contact_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}/detail"
    
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
                print(f"Ravan Contact Detail Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch contact details: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching contact details from Ravan: {str(e)}")

@router.get("/agents")
async def get_raw_agents():
    from dotenv import load_dotenv
    load_dotenv(override=True)
    
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    
    # Dynamically linearly extract ALL bounded agents securely from `.env` (AGENT_ID, AGENT_ID_2, etc.)
    valid_env_agent_ids = [
        val for key, val in os.environ.items() 
        if key.startswith("AGENT_ID") and val.strip()
    ]

    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/agents?limit=100"
    headers = {"X-Api-Key": api_key, "Accept": "application/json"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                # Dynamically securely filter the remote pool bounding strictly onto explicitly active environment agents!
                if valid_env_agent_ids:
                    # Filter Ravan's remote raw AI bots array to exclusively only contain explicitly mapped tethered logics
                    if data.get("data"):
                        filtered = [a for a in data["data"] if a.get("id") in valid_env_agent_ids]
                        data["data"] = filtered
                        data["meta"] = {"total": len(filtered)}
                return data
            return {"success": True, "data": [], "meta": {"total": 0}}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching agents: {str(e)}")

@router.get("/contacts/{contact_id}/activities")
async def get_contact_activities(contact_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}/activities"
    headers = {"X-Api-Key": api_key, "Accept": "application/json"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            return {"success": True, "data": []}
        except Exception as e:
            return {"success": False, "data": [], "error": str(e)}

@router.get("/contacts/{contact_id}/campaigns")
async def get_contact_campaigns(contact_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}/campaigns"
    headers = {"X-Api-Key": api_key, "Accept": "application/json"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            return {"success": True, "data": []}
        except Exception as e:
            return {"success": False, "data": [], "error": str(e)}

@router.get("/contacts/{contact_id}/notes")
async def get_contact_notes(contact_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}/notes"
    headers = {"X-Api-Key": api_key, "Accept": "application/json"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            return {"success": True, "data": []}
        except Exception as e:
            return {"success": False, "data": [], "error": str(e)}

class BulkDeleteModel(BaseModel):
    ids: List[str]

@router.post("/contacts/bulk-delete")
async def bulk_delete_contacts(req: BulkDeleteModel):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/contacts/bulk-delete"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json={"ids": req.ids}, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Bulk Delete Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to bulk delete contacts: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching contacts from Ravan: {str(e)}")

@router.get("/contacts/{contact_id}/detail")
async def get_contact_detail_credits(contact_id: str):
    """
    Explicitly pull precise details natively extracting exact credits usage parameters.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}/detail"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return data
            else:
                print(f"Ravan Contact Detail Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch contact details")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching contact detail: {str(e)}")

class UpdateContactRequest(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    metadata: Optional[dict] = None

@router.patch("/contacts/{contact_id}")
async def update_contact(contact_id: str, payload: UpdateContactRequest):
    """
    Proxies contact mutations robustly against target outbound profiles.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}"
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            # Drop None values out of payload natively
            clean_payload = {k: v for k, v in payload.model_dump().items() if v is not None}
            response = await client.patch(url, headers=headers, json=clean_payload)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Contact Update Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to update contact: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error updating contact: {str(e)}")

class CreateContactModel(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = {}
    customVariables: Optional[dict] = {}
    tags: Optional[List[str]] = []

@router.post("/contacts/")
async def create_contact(req: CreateContactModel):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/contacts/"
    headers = {"X-Api-Key": api_key, "Content-Type": "application/json"}

    payload = {k: v for k, v in req.dict(exclude_none=True).items() if v != ""}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                
                # Instantly extract mapped active environment campaign id for seamless binding
                from dotenv import load_dotenv
                load_dotenv(override=True)
                env_campaign_id = os.environ.get("CAMPAIGN_ID") or os.environ.get("CAMPAIGNS")
                
                # If an active campaign exists globally, dynamically physically bind the new contact to it natively
                if env_campaign_id and data.get("data") and data["data"].get("id"):
                    try:
                        new_id = data["data"]["id"]
                        bind_url = f"https://api.ravan.ai/api/v1/campaigns/{env_campaign_id}/contacts"
                        await client.post(bind_url, headers=headers, json={"contactIds": [new_id]})
                    except Exception as bind_err:
                        print("Warning: Failed to map new contact directly into active campaign:", bind_err)

                return data
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error creating contact: {str(e)}")

class BindContactsRequest(BaseModel):
    contactIds: List[str]

@router.post("/campaigns/{campaign_id}/bind-contacts")
async def bind_contacts_to_campaign(campaign_id: str, req: BindContactsRequest):
    """
    Explicitly assign arbitrary bulk blocks of Target UI mapped Contacts natively onto an explicit Outbound Core mapped campaign.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}/contacts"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json={"contactIds": req.contactIds})
            if response.status_code in [200, 201]:
                return response.json()
            else:
                print(f"Ravan Campaign Explicit Bind Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to bind target nodes: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error binding contacts on Ravan: {str(e)}")

@router.post("/campaigns/{campaign_id}/start")
async def start_campaign(campaign_id: str):
    """Start explicitly executing assigned campaign operations on remote dialer core."""
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}/start"
    headers = {"X-Api-Key": api_key, "Accept": "application/json", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers)
            if response.status_code in [200, 201]:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to start campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")

@router.post("/campaigns/{campaign_id}/pause")
async def pause_campaign(campaign_id: str):
    """Pause explicitly executing assigned campaign operations on remote dialer core."""
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}/pause"
    headers = {"X-Api-Key": api_key, "Accept": "application/json", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers)
            if response.status_code in [200, 201]:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to pause campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")

@router.post("/campaigns/{campaign_id}/resume")
async def resume_campaign(campaign_id: str):
    """Resume a paused campaign natively on Ravan."""
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}/resume"
    headers = {"X-Api-Key": api_key, "Accept": "application/json", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers)
            if response.status_code in [200, 201]:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to resume campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")

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

@router.patch("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, payload: dict):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.patch(url, json=payload, headers=headers)
            if response.status_code in [200, 201]:
                return response.json()
            else:
                print(f"Ravan Campaign Update Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to update campaign: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error updating campaign on Ravan: {str(e)}")


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

@router.get("/calling/call-sessions")
async def list_call_sessions(
    page: int = 1,
    page_size: int = 20,
    agent_id: Optional[str] = None,
    status: Optional[str] = None,
    channel: Optional[str] = None,
    caller_number: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None,
    started_after: Optional[str] = None,
    started_before: Optional[str] = None,
    campaign_id: Optional[str] = None,
):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/calling/call-sessions"
    
    # Pack only provided variables native to the request query
    params = {
        "page": page,
        "page_size": page_size
    }
    if agent_id: params["agent_id"] = agent_id
    if campaign_id: params["campaign_id"] = campaign_id
    if status: params["status"] = status
    if channel: params["channel"] = channel
    if caller_number: params["caller_number"] = caller_number
    if search: params["search"] = search
    if sort_by: params["sort_by"] = sort_by
    if sort_order: params["sort_order"] = sort_order
    if started_after: params["started_after"] = started_after
    if started_before: params["started_before"] = started_before

    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                
                # Simply return all global sessions mapped to this key
                return data
            else:
                print(f"Ravan Call Sessions Fetch Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch call sessions: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching call sessions from Ravan: {str(e)}")

@router.get("/calling/phone-history")
async def get_phone_history(
    phone: str,
    page: int = 1,
    page_size: int = 20,
    include_transcripts: bool = False,
    agent_id: str = None
):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/calling/phone-history"
    
    params = {
        "phone": phone,
        "page": page,
        "page_size": page_size
    }
    if include_transcripts:
        params["include_transcripts"] = "true"
    if agent_id:
        params["agent_id"] = agent_id

    print(f"[DEBUG PHONE HISTORY] Requesting Phone: {phone} with params: {params}")

    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            print(f"[DEBUG PHONE HISTORY] Response Status: {response.status_code}")
            print(f"[DEBUG PHONE HISTORY] Response Body: {response.text}")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Phone History Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch phone history: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching phone history from Ravan: {str(e)}")

from fastapi.responses import RedirectResponse, StreamingResponse

@router.get("/calling/audio-stream")
async def get_call_audio_stream(url: str):
    """
    Solves X-Api-Key auth block internally when playing recordings on UI <audio>.
    Checks if Ravan redirects to AWS S3 Presigned URL, if so perfectly routes browser to it natively!
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    headers = {"X-Api-Key": api_key} if "ravan.ai" in url else {}

    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url, headers=headers, follow_redirects=False)
            
            # If AI cleanly redirects to an S3 bucket or blob storage, send client there directly
            if res.status_code in [301, 302, 303, 307, 308]:
                return RedirectResponse(url=res.headers["Location"])
                
            # If AI serves binary natively, forcefully pipe output chunks back safely
            if res.status_code == 200:
                content_type = res.headers.get("content-type", "")
                
                # If Ravan unexpectedly resolves the 200 OK directly into a JSON wrapper payload
                if "application/json" in content_type:
                    data = res.json()
                    rec_url = data.get("recording_url") or data.get("data", {}).get("recording_url")
                    if rec_url:
                        return RedirectResponse(url=rec_url)
                    raise HTTPException(status_code=404, detail="JSON payload did not contain recording_url")

                # If AI serves binary natively, forcefully pipe output chunks back safely
                async def generate_stream():
                    async with httpx.AsyncClient() as stream_client:
                        async with stream_client.stream("GET", url, headers=headers) as stream_res:
                            async for chunk in stream_res.aiter_bytes():
                                yield chunk
                return StreamingResponse(generate_stream(), media_type=content_type or "audio/mpeg")
                
            raise HTTPException(status_code=res.status_code, detail=f"Failed to fetch upstream audio payload. Code: {res.status_code}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Internal network error intercepting audio: {str(e)}")


@router.get("/calling/call-sessions-detail/{session_id}")
async def get_call_session_detail(session_id: str):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/calling/call-sessions-detail/{session_id}"
    
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
                print(f"Ravan Call Session Detail Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch call session details: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching call session details from Ravan: {str(e)}")

@router.get("/calling/global-cost-aggregation")
async def get_global_cost_aggregation():
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    headers = {"X-Api-Key": api_key, "Accept": "application/json"}
    
    # Using the standard call-sessions endpoint which returns all calls for all users globally in this account
    url = "https://api.ravan.ai/api/v1/calling/call-sessions?page=1&page_size=10000"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                # Parse native global structure
                sessions = data.get("data", {}).get("callSessions", []) if data.get("data") else []
                total_seconds = sum([float(s.get("duration") or s.get("durationIdSec") or s.get("duration_sec") or 0) for s in sessions])
                total_credits = total_seconds / 60.0
                return {"success": True, "total_coins": total_credits}
            else:
                return {"success": False, "total_coins": 0.0}
        except Exception as e:
            return {"success": False, "total_coins": 0.0, "error": str(e)}

