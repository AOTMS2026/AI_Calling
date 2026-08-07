import os
import httpx
import json
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Depends, Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.config import settings
from dotenv import load_dotenv
from sqlmodel import Session, select
from app.database.connection import get_session, engine
from app.models.domain import User, PurchasedPhoneNumber, DashboardMetrics, InboundCampaign, Assign_Agents, CallRecord, Assign_Campaigns
from app.api.dependencies import get_current_user
from datetime import datetime
import urllib.parse
import asyncio
from app.core.redis_client import get_cache, set_cache, delete_cache, generate_cache_key


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

    from app.core.redis_client import get_cache, set_cache, generate_cache_key
    cache_key = generate_cache_key("tools_list", limit=limit, offset=offset, agent_id=agent_id)
    cached = await get_cache(cache_key)
    if cached:
        print("⚡ REDIS CACHE HIT: Bypassed Ravan.ai - Extracted tools array natively in <1ms!")
        return cached

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
                data = response.json()
                await set_cache(cache_key, data, 600)
                return data
            else:
                print(f"Ravan Tools List Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch tools list: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error fetching tools list from Ravan: {str(e)}")

@router.post("/tools")
async def create_ravan_tool(payload: dict):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/tools/"
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code in (200, 201):
                from app.core.redis_client import delete_cache
                await delete_cache("tools_list")
                return response.json()
            else:
                print(f"Ravan Tool Create Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to create tool. Server responded: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error creating tool in Ravan: {str(e)}")

@router.post("/calcom/appointments/manage")
async def manage_calcom_setup(payload: dict):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/calcom/appointments/manage"
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code in (200, 201):
                return response.json()
            else:
                print(f"Ravan Calcom Manage Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to configure Cal.com schedule structure. Server responded: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error managing Cal.com setup in Ravan: {str(e)}")

@router.delete("/tools/{tool_id}")
async def delete_ravan_tool(tool_id: str):
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
            response = await client.delete(url, headers=headers)
            if response.status_code in (200, 201, 204):
                from app.core.redis_client import delete_cache
                await delete_cache("tools_list")
                return {"success": True}
            else:
                print(f"Ravan Tool Delete Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to delete tool: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error deleting tool in Ravan: {str(e)}")

@router.patch("/tools/{tool_id}")
async def update_ravan_tool(tool_id: str, payload: dict):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/tools/{tool_id}"
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.patch(url, json=payload, headers=headers)
            if response.status_code in (200, 201):
                from app.core.redis_client import delete_cache
                await delete_cache("tools_list")
                return response.json()
            else:
                print(f"Ravan Tool Update Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to update tool: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error updating tool in Ravan: {str(e)}")

@router.get("/phone-numbers/available-numbers/{iso_country}")
async def get_available_numbers(
    iso_country: str,
    page_size: int = 10,
    region: str = None
):
    exact_numbers = [
        "+918035463568",
        "+918035762861",
        "+918035089381",
        "+918035410079",
        "+918035463463",
        "+918035614034",
        "+918035410288",
        "+918035614000",
        "+918035410066",
        "+918035614241",
        "+918035089380",
        "+918035089277",
        "+918035089415",
        "+918035396826",
        "+918035614209",
        "+918035614033",
        "+918035396349",
        "+918035462838",
        "+918035410441",
        "+918035762796"
    ]
    
    mock_numbers = []
    for mobile in exact_numbers:
        mock_numbers.append({
            "phoneNumber": mobile,
            "isoCountry": iso_country,
            "price": "295.00",
            "perMinutePriceInbound": 0.6,
            "perMinutePriceOutbound": 0.6,
            "telephonyType": "india"
        })
    
    return {
        "success": True,
        "message": "Available numbers locally mocked successfully",
        "data": mock_numbers
    }


class BuyNumberRequest(BaseModel):
    phone_number: str
    price: float
    per_minute_price_inbound: float
    per_minute_price_outbound: float

@router.post("/phone-numbers/buy")
async def buy_phone_number(
    payload: BuyNumberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    # Mocking successful buy operation without calling Ravan API
    new_number = PurchasedPhoneNumber(
        user_id=current_user.id,
        phone_number=payload.phone_number,
        price=payload.price,
        per_minute_price_inbound=payload.per_minute_price_inbound,
        per_minute_price_outbound=payload.per_minute_price_outbound,
        status="Pending"
    )
    db.add(new_number)
    db.commit()
    db.refresh(new_number)
    
    return {
        "success": True, 
        "message": f"Successfully purchased {payload.phone_number} locally",
        "data": {
            "id": new_number.id,
            "phoneNumber": payload.phone_number,
            "status": "Pending"
        }
    }

class UpdateStatusModel(BaseModel):
    status: str

@router.patch("/phone-numbers/{number_id}/status")
async def update_phone_number_status(
    number_id: int,
    payload: UpdateStatusModel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")
        
    number = db.get(PurchasedPhoneNumber, number_id)
    if not number:
        raise HTTPException(status_code=404, detail="Phone number not found.")
        
    number.status = payload.status
    db.commit()
    db.refresh(number)
    
    return {"success": True, "message": "Status updated successfully", "data": {"id": number.id, "status": number.status}}

@router.get("/phone-numbers/my")
async def get_my_phone_numbers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    # Fetch user's own numbers
    numbers = db.exec(select(PurchasedPhoneNumber).where(PurchasedPhoneNumber.user_id == current_user.id)).all()
    
    # If customer and has no standalone numbers, fallback to the Admin's global pool so their Caller ID dropdown is populated
    if not numbers and current_user.role != 'admin':
        admin_users = db.exec(select(User).where(User.role == 'admin')).all()
        admin_ids = [u.id for u in admin_users]
        if admin_ids:
            numbers = db.exec(select(PurchasedPhoneNumber).where(PurchasedPhoneNumber.user_id.in_(admin_ids))).all()
            
    # Ultimate safeguard for broken databases where an orphaned number exists but no admin controls it
    if not numbers:
        numbers = db.exec(select(PurchasedPhoneNumber)).all()
            
    return {"success": True, "data": numbers}

@router.get("/phone-numbers/all")
async def get_all_phone_numbers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")
        
    purchased = db.exec(select(PurchasedPhoneNumber)).all()
    
    data = []
    for pn in purchased:
        u = db.get(User, pn.user_id) if pn.user_id else None
        data.append({
            "id": pn.id,
            "phone_number": pn.phone_number,
            "price": pn.price,
            "status": pn.status,
            "created_at": pn.created_at,
            "user_name": u.name if u else "Deleted/System User",
            "user_email": u.email if u else "N/A"
        })
        
    return {"success": True, "data": data}


from app.api.dependencies import get_current_user
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models.domain import User, Assign_Campaigns

@router.get("/campaigns")
async def get_outbound_campaigns(limit: int = 100, offset: int = 0, current_user: User = Depends(get_current_user), db: Session = Depends(get_session)):
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
                raw_campaigns = data.get("data", [])
                
                # Multi-Tenant Mapping Pipeline (Aligns directly with Assign_Campaigns mirroring Agents logic!)
                if current_user.role != 'admin':
                    assigned = db.exec(select(Assign_Campaigns.campaign_id).where(Assign_Campaigns.user_id == current_user.id)).all()
                    
                    # Also include any direct legacy fallback mapping strictly for cross-compatibility
                    allowed_ids = set(assigned)
                    if current_user.ravan_campaign_id:
                        allowed_ids.add(current_user.ravan_campaign_id)
                        
                    filtered = [c for c in raw_campaigns if c.get("id") in allowed_ids]
                    return {"success": True, "data": filtered}
                else:
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
            
            from app.core.redis_client import delete_cache
            await delete_cache("call_sessions")

            return res.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network bridge timeout mapping websocket token request block: {str(e)}")

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
async def delete_campaign(campaign_id: str, db: Session = Depends(get_session)):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    # 1. Clean up from local database first: Assign_Campaigns table
    try:
        from app.models.domain import Assign_Campaigns
        from sqlmodel import select
        assignments = db.exec(select(Assign_Campaigns).where(Assign_Campaigns.campaign_id == campaign_id)).all()
        for assignment in assignments:
            db.delete(assignment)
        db.commit()
    except Exception as db_err:
        print("[Delete Campaign DB Cleanup Error]:", str(db_err))

    # 2. Delete from Ravan.ai API
    url = f"https://api.ravan.ai/api/v1/campaigns/{campaign_id}"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(url, headers=headers)
            if response.status_code in [200, 204]:
                return {"success": True, "message": "Campaign deleted successfully from both database and Ravan."}
            else:
                if response.status_code == 404:
                    return {"success": True, "message": "Campaign record deleted locally (not found on Ravan)."}
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

@router.get("/contacts")
async def get_global_contacts(
    limit: int = 5000, 
    offset: int = 0, 
    search: Optional[str] = None, 
    campaign_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    from app.core.redis_client import get_cache, set_cache, generate_cache_key
    
    # Isolate cache stringently by User explicitly preventing tenant leakage
    cache_key = generate_cache_key("contacts", user_id=current_user.id, limit=limit, offset=offset, search=search, campaign_id=campaign_id)
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data
        
    import asyncio
    assigned_campaigns = []
    
    if current_user.role == 'admin':
        from dotenv import load_dotenv
        load_dotenv(override=True)
        env_campaign_id = campaign_id or os.environ.get("CAMPAIGN_ID") or os.environ.get("CAMPAIGNS")
        if env_campaign_id:
            assigned_campaigns.append(env_campaign_id)
    else:
        # Non-admins get strictly physical POSTGRESQL mapped Assigned Campaigns!
        from sqlmodel import select
        from app.models.domain import Assign_Campaigns
        records = db.exec(select(Assign_Campaigns.campaign_id).where(Assign_Campaigns.user_id == current_user.id)).all()
        if records:
            assigned_campaigns = list(set(records))
            
    # Include an explicitly mapped param if explicitly provided by a valid user flow
    if campaign_id and campaign_id not in assigned_campaigns:
        assigned_campaigns.append(campaign_id)

    if not assigned_campaigns:
        return {"success": True, "data": []}

    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async def fetch_campaign_contacts(client, cid):
        url = f"https://api.ravan.ai/api/v1/campaigns/{cid}/contacts?limit={limit}&offset={offset}"
        if search:
            url += f"&search={urllib.parse.quote(search)}"
        try:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return data.get("data", [])
        except Exception:
            pass
        return []

    async with httpx.AsyncClient() as client:
        tasks = [fetch_campaign_contacts(client, c) for c in assigned_campaigns]
        arrays = await asyncio.gather(*tasks)
        
        merged_dict = {}
        for arr in arrays:
            for item in arr:
                key = item.get("id") or item.get("contactId")
                if key:
                    merged_dict[key] = item
                    
        payload_data = list(merged_dict.values())
        
        # Immediate PostgreSQL fallback if Ravan.ai is empty or crashed (as requested!)
        if not payload_data:
            from sqlmodel import select
            from app.models.domain import Contact
            # Select all contacts natively matching assigned_campaigns
            local_contacts = db.exec(select(Contact).where(Contact.campaign_id.in_(assigned_campaigns))).all()
            for lc in local_contacts:
                payload_data.append({
                    "id": lc.contact_id or lc.phone,
                    "name": lc.name or f"{lc.first_name or ''} {lc.last_name or ''}".strip(),
                    "phone": lc.phone,
                    "email": lc.email,
                    "tags": lc.tags.split(",") if lc.tags else [],
                    "campaignId": lc.campaign_id,
                    "agentId": lc.agent_id
                })
                    
        payload = {"success": True, "data": payload_data}
        await set_cache(cache_key, payload, 300) # Fast cached lookup for 5 minutes
        return payload

@router.get("/contacts/{contact_id}/detail")
async def get_contact_detail(contact_id: str, db: Session = Depends(get_session)):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}/detail"
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async def fetch_local_fallback():
        from sqlmodel import select
        from app.models.domain import Contact
        lc = db.exec(select(Contact).where((Contact.contact_id == contact_id) | (Contact.phone == contact_id))).first()
        if not lc: return None
        return {
            "success": True, 
            "data": {
                "contact": {
                    "id": lc.contact_id or lc.phone,
                    "name": lc.name or f"{lc.first_name or ''} {lc.last_name or ''}".strip(),
                    "phone": lc.phone,
                    "email": lc.email,
                    "tags": lc.tags.split(",") if lc.tags else [],
                    "campaignId": lc.campaign_id,
                    "agentId": lc.agent_id
                },
                "activities": [],
                "campaigns": [{"id": lc.campaign_id, "name": "Local Database Native Campaign", "agentId": lc.agent_id}] if lc.campaign_id else [],
                "recentCalls": []
            }
        }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ravan Contact Detail Error ({response.status_code}):", response.text)
                fb = await fetch_local_fallback()
                if fb: return fb
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch contact details: {response.text}")
        except Exception as e:
            fb = await fetch_local_fallback()
            if fb: return fb
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

    from app.core.redis_client import get_cache, set_cache
    cache_key = "dashboard_raw_agents_pool"
    cached_data = await get_cache(cache_key)
    if cached_data:
        print("⚡ REDIS CACHE HIT: Bypassed Ravan.ai - Extracted pure agents array for dashboard natively in <1ms!")
        return cached_data

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
                
                await set_cache(cache_key, data, 600)
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
                from app.core.redis_client import delete_cache
                await delete_cache("contacts")
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
                from app.core.redis_client import delete_cache
                await delete_cache("contacts")
                return response.json()
            else:
                print(f"Ravan Contact Update Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to update contact: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error updating contact: {str(e)}")

@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    """
    Physically maps a native explicit contact deletion against Ravan AI.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = f"https://api.ravan.ai/api/v1/contacts/{contact_id}"
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(url, headers=headers)
            if response.status_code in [200, 201, 204]:
                from app.core.redis_client import delete_cache
                await delete_cache("contacts")
                return {"success": True, "message": "Contact dynamically deleted."}
            else:
                print(f"Ravan Contact Delete Error ({response.status_code}):", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Failed to delete contact: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error deleting contact: {str(e)}")

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
    agentId: Optional[str] = None
    campaignId: Optional[str] = None

@router.post("/contacts/")
async def create_contact(req: CreateContactModel, db: Session = Depends(get_session)):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    if not api_key:
        raise HTTPException(status_code=500, detail="RAVAN_API_KEY is missing.")

    url = "https://api.ravan.ai/api/v1/contacts/"
    headers = {"X-Api-Key": api_key, "Content-Type": "application/json"}

    payload = {k: v for k, v in req.dict(exclude_none=True).items() if v != ""}
    # Safely strip agentId from Ravan payload as it's meant strictly for our local DB schema tracking!
    payload.pop("agentId", None)
    payload.pop("campaignId", None)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                from dotenv import load_dotenv
                load_dotenv(override=True)
                
                # Dynamic FrontEnd-First Campaign Targeting Injection over Local env
                env_campaign_id = req.campaignId or os.environ.get("CAMPAIGN_ID") or os.environ.get("CAMPAIGNS")
                
                new_id = None
                if data.get("data") and data["data"].get("id"):
                    new_id = data["data"]["id"]
                    if env_campaign_id:
                        try:
                            bind_url = f"https://api.ravan.ai/api/v1/campaigns/{env_campaign_id}/contacts"
                            await client.post(bind_url, headers=headers, json={"contactIds": [new_id]})
                        except Exception as bind_err:
                            print("Warning: Failed to map new contact directly into active campaign:", bind_err)
                            
                # Safely sync to local Postgres Native DB 
                try:
                    from sqlalchemy.dialects.postgresql import insert as pg_insert
                    stmt = pg_insert(Contact).values([{
                        "name": req.name,
                        "phone": req.phone,
                        "email": req.email,
                        "contact_id": new_id,
                        "campaign_id": env_campaign_id,
                        "agent_id": req.agentId,
                        "tags": ",".join(req.tags) if req.tags else "Customer"
                    }]).on_conflict_do_nothing()
                    db.execute(stmt)
                    db.commit()
                except Exception as pg_err:
                    print("Local Postgres DB Sync fallback failed:", pg_err)

                from app.core.redis_client import delete_cache
                await delete_cache("contacts")

                return data
            else:
                raise HTTPException(status_code=response.status_code, detail=response.text)
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error creating contact: {str(e)}")

@router.post("/contacts/{contact_id}/call")
async def trigger_contact_call(contact_id: str, request: Request, current_user: User = Depends(get_current_user)):
    """Dispatch Outbound Call Trigger wrapping contact dynamically!"""
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    payload = await request.json()
    
    url = "https://api.ravan.ai/api/v1/calls/outbound"
    headers = {"X-Api-Key": api_key, "Accept": "application/json", "Content-Type": "application/json"}
    
    outbound_structure = {
        "contactId": contact_id,
        "campaignId": payload.get("campaignId") or current_user.ravan_campaign_id or None,
        "agentId": payload.get("agentId") or current_user.ravan_agent_id or None,
        "fromNumber": payload.get("fromNumber") or "",
        "toNumber": payload.get("toNumber")
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, headers=headers, json={k: v for k, v in outbound_structure.items() if v})
            return {"success": True, "provider_status": res.status_code, "data": res.json() if res.status_code == 200 else res.text}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

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
    phoneNumberId: Optional[str] = None
    fromPhoneNumber: str
    contactIds: Optional[List[str]] = []
    schedule: Optional[CampaignSchedule] = None

@router.post("/campaigns/create")
async def create_campaign(
    payload: CreateCampaignRequest,
    current_user: User = Depends(get_current_user)
):
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
    
    # Strip faux ID so Ravan falls back natively to 'fromPhoneNumber' exact matching
    if body.get("phoneNumberId") == "phone-id-placeholder":
        del body["phoneNumberId"]
        
    # Strict Campaign naming cleanly overrides
    if current_user.role != 'admin':
        base_name = body.get("name", "Unnamed Campaign").split(" [HASH:")[0]
        body["name"] = f"{base_name}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=body, headers=headers)
            if response.status_code == 200 or response.status_code == 201:
                res_data = response.json()
                
                # Assign Campaign automatically to the creator dynamically!
                camp_id = res_data.get("data", {}).get("id") or res_data.get("id")
                if camp_id:
                    with Session(engine) as db:
                        from app.models.domain import Assign_Campaigns
                        from sqlmodel import select
                        
                        existing = db.exec(select(Assign_Campaigns).where(Assign_Campaigns.campaign_id == camp_id, Assign_Campaigns.user_id == current_user.id)).first()
                        if not existing:
                            new_assign = Assign_Campaigns(
                                campaign_id=camp_id,
                                agent_id=body.get("agentId"),
                                user_id=current_user.id,
                                campaign_name=body.get("name")
                            )
                            db.add(new_assign)
                            db.commit()
                            
                return res_data
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

async def sync_call_metrics_to_db(agent_id: str):
    if not agent_id: return
    try:
        api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
        url = "https://api.ravan.ai/api/v1/calling/call-sessions"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            fetch_params = {"page_size": 5000}
                
            resp = await client.get(url, params=fetch_params, headers={"X-Api-Key": api_key, "Accept": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                s_list = data.get("data", {}).get("callSessions", []) if isinstance(data.get("data"), dict) else data.get("data", [])
                
                sessions = []
                for s in s_list:
                    if agent_id == "ROOT_DEFAULT":
                        sessions.append(s)
                        continue
                    if s.get("agentId") == agent_id:
                        sessions.append(s)

                with Session(engine) as db:
                    metric = db.exec(select(DashboardMetrics).where(DashboardMetrics.agent_id == agent_id)).first()
                    if not metric:
                        metric = DashboardMetrics(agent_id=agent_id)
                        db.add(metric)
                    
                    total_c = len(sessions)
                    # Include all terminal success states but securely EXCLUDE blind outbound completions to allow native ML bridging!
                    succ_c = sum([1 for s in sessions if str(s.get("status") or "").lower() in ["completed", "ended", "success"] and str(s.get("channel") or "").lower() != "outbound-api"])
                    fail_c = sum([1 for s in sessions if str(s.get("status") or "").lower() in ["failed", "no_answer", "error"]])
                    raw_cost = sum([float(s.get("costTotal") or 0.0) for s in sessions])
                    
                    # Mathematical Success Rate tracking and 4-point precision float rounding for explicit Cost metrics
                    succ_rate = round((succ_c / total_c * 100), 2) if total_c > 0 else 0.0
                    
                    metric.total_duration_sec = sum([int(s.get("durationSec") or 0) for s in sessions])
                    # Multiply total raw cost by 7rs coefficient natively in database!
                    metric.total_cost = round((raw_cost * 7.0), 4)
                    metric.total_calls = total_c
                    metric.success_calls = succ_c
                    metric.failed_calls = fail_c
                    metric.success_rate = succ_rate
                    metric.last_updated = datetime.utcnow()
                    
                    db.commit()
                    print(f"[METRICS SYNC] agent_id={agent_id[:8]}... total={total_c} success={succ_c} rate={succ_rate}%")
                    try:
                        from app.core.redis_client import delete_cache
                        import asyncio
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            loop.create_task(delete_cache("dashboard_metrics_"))
                        else:
                            loop.run_until_complete(delete_cache("dashboard_metrics_"))
                    except Exception as cache_err:
                        print(f"Failed to invalidate dashboard cache: {cache_err}")
    except Exception as e:
        print("Failed Async DB Metrics Sync Trigger:", str(e))

@router.get("/dashboard/metrics")
async def get_dashboard_metrics_trigger(
    response: Response,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Renders PostgreSQL aggregated Dashboard metrics intelligently across unified agent fleets!
    With Redis caching and Edge CDN support.
    """
    response.headers["Cache-Control"] = "public, max-age=10, s-maxage=60"
    cache_key = f"dashboard_metrics_{current_user.id}"
    
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    try:
        agent_uuids = [current_user.ravan_agent_id] if current_user.ravan_agent_id else []
        
        # 1. Append assigned Agents natively
        assigned_records = db.exec(select(Assign_Agents.agent_id).where(Assign_Agents.user_id == current_user.id)).all()
        agent_uuids.extend(assigned_records)
        
        # 2. Append Agents utilized natively by explicitly mapped Campaigns
        assigned_campaigns = db.exec(select(Assign_Campaigns.agent_id).where(Assign_Campaigns.user_id == current_user.id)).all()
        agent_uuids.extend([c for c in assigned_campaigns if c is not None])
        
        target_agent_uuids = set(agent_uuids)

        if current_user.role == 'admin':
            # For admin, we should work default
            target_agent_uuids.add("ROOT_DEFAULT")

        metrics = []
        for uid in target_agent_uuids:
            metric = db.exec(select(DashboardMetrics).where(DashboardMetrics.agent_id == uid)).first()
            if not metric or (datetime.utcnow() - metric.last_updated).total_seconds() > 300:
                background_tasks.add_task(sync_call_metrics_to_db, uid)
            if metric:
                metrics.append(metric)

        if not metrics:
            res = {"data": None}
            await set_cache(cache_key, res, ttl_seconds=30)
            return res

        # Mathematical pure DB aggregation across all user agents
        agg = {
            "total_calls": sum(m.total_calls for m in metrics),
            "total_cost": round(sum(m.total_cost for m in metrics), 4),
            "success_calls": sum(m.success_calls for m in metrics),
            "failed_calls": sum(m.failed_calls for m in metrics),
            "total_duration_sec": sum(m.total_duration_sec for m in metrics),
        }
        
        # Structurally Extract Genuine Ravan AI Campaign level Outbound Success Metrics
        try:
            api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
            async with httpx.AsyncClient() as client:
                camp_resp = await client.get("https://api.ravan.ai/api/v1/campaigns/?limit=100", headers={"X-Api-Key": api_key})
                if camp_resp.status_code == 200:
                    c_data = camp_resp.json().get("data", [])
                    mapped_campaigns = db.exec(select(Assign_Campaigns.campaign_id).where(Assign_Campaigns.user_id == current_user.id)).all()
                    
                    allowed_c_ids = set(mapped_campaigns)
                    if current_user.ravan_campaign_id:
                        allowed_c_ids.add(current_user.ravan_campaign_id)
                        
                    for c in c_data:
                        if current_user.role == 'admin' or c.get("id") in allowed_c_ids:
                            stats = c.get("contactStats", {})
                            agg["success_calls"] += stats.get("successful", 0)
        except Exception as ce:
            print("Failed to sync true campaign ML stats to Dashboard:", str(ce))

        agg["success_rate"] = round((agg["success_calls"] / agg["total_calls"] * 100), 2) if agg["total_calls"] > 0 else 0.0
        
        res = {"data": agg}
        # Cache for short duration as metrics can change dynamically
        await set_cache(cache_key, res, ttl_seconds=30)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all-call-history")
async def get_all_call_history(
    request: Request,
    page: int = 1,
    page_size: int = 50,
    status: Optional[str] = None,
    channel: Optional[str] = None,
    agent_id: Optional[str] = None,
    sentiment: Optional[str] = None,
    disconnect_reason: Optional[str] = None,
    call_type: Optional[str] = None,
    caller_name: Optional[str] = None,
    caller_number: Optional[str] = None,
    duration_min: Optional[int] = None,
    duration_max: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Fetches ALL call history from Ravan.ai with comprehensive filtering.
    Supports status, channel, agent, sentiment, disconnect reason, call type,
    caller name, caller number, and duration range filters.
    Falls back to local PostgreSQL CallRecord table when Ravan is unavailable.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    url = "https://api.ravan.ai/api/v1/calling/call-sessions"

    params = {"page_size": 2000}
    if status and status.lower() not in ("all", ""):
        params["status"] = status
    if channel and channel.lower() not in ("all", ""):
        params["channel"] = channel

    # Build target agent UUIDs
    target_agent_uuids = set()
    if current_user.role != 'admin':
        a_uuids = [current_user.ravan_agent_id] if current_user.ravan_agent_id else []
        assigned_records = db.exec(select(Assign_Agents.agent_id).where(Assign_Agents.user_id == current_user.id)).all()
        a_uuids.extend(assigned_records)
        assigned_campaigns = db.exec(select(Assign_Campaigns.agent_id).where(Assign_Campaigns.user_id == current_user.id)).all()
        a_uuids.extend([c for c in assigned_campaigns if c is not None])
        target_agent_uuids = set(filter(None, a_uuids))

    def build_local_fallback():
        q = select(CallRecord)
        if status and status.lower() not in ("all", ""):
            q = q.where(CallRecord.status == status)
        if channel and channel.lower() not in ("all", ""):
            q = q.where(CallRecord.channel == channel)
        if agent_id:
            q = q.where(CallRecord.agent_id == agent_id)
        if caller_number:
            q = q.where(
                (CallRecord.caller_number.contains(caller_number)) |
                (CallRecord.callee_number.contains(caller_number))
            )
        if caller_name:
            q = q.where(CallRecord.caller_name.contains(caller_name))
        if disconnect_reason:
            q = q.where(CallRecord.disconnect_reason == disconnect_reason)
        if sentiment:
            q = q.where(CallRecord.sentiment == sentiment)
        if duration_min is not None:
            q = q.where(CallRecord.duration_sec >= duration_min)
        if duration_max is not None:
            q = q.where(CallRecord.duration_sec <= duration_max)

        local_recs = db.exec(q.order_by(CallRecord.created_at.desc())).all()
        sessions = []
        for r in local_recs:
            sessions.append({
                "id": r.call_id,
                "agentId": r.agent_id,
                "agentName": r.agent_name,
                "callerNumber": r.caller_number,
                "calleeNumber": r.callee_number,
                "callerName": r.caller_name,
                "channel": r.channel,
                "status": r.status,
                "durationSec": r.duration_sec,
                "costTotal": r.cost,
                "summary": r.summary,
                "recordingUrl": r.recording_url,
                "disconnectReason": r.disconnect_reason,
                "errorMessage": r.error_message,
                "sentiment": r.sentiment,
                "startedAt": str(r.started_at) if r.started_at else None,
                "endedAt": str(r.ended_at) if r.ended_at else None,
                "createdAt": str(r.created_at),
                "metadata": {}
            })
        total = len(sessions)
        start_idx = (page - 1) * page_size
        paged = sessions[start_idx: start_idx + page_size]
        return {"data": {"callSessions": paged, "totalCount": total}}

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(url, params=params, headers={"X-Api-Key": api_key, "Accept": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                s_list = data.get("data", {}).get("callSessions", []) if isinstance(data.get("data"), dict) else (data.get("calls", []) or data.get("data", []))
                if isinstance(s_list, dict):
                    s_list = s_list.get("callSessions", []) or []

                filtered_sessions = []
                for s in s_list:
                    s_agent_id = str(s.get("agentId") or s.get("agent_id") or "")
                    if current_user.role != 'admin' and target_agent_uuids and s_agent_id not in target_agent_uuids:
                        continue

                    if agent_id and s_agent_id != agent_id:
                        continue
                    if status and status.lower() not in ("all", "") and str(s.get("status") or "").lower() != status.lower():
                        continue
                    if channel and channel.lower() not in ("all", "") and str(s.get("channel") or "").lower() != channel.lower():
                        continue
                    if caller_number:
                        c1 = str(s.get("callerNumber") or s.get("caller_number") or "")
                        c2 = str(s.get("calleeNumber") or s.get("callee_number") or "")
                        if caller_number not in c1 and caller_number not in c2:
                            continue
                    if caller_name:
                        cn = str(s.get("callerName") or s.get("caller_name") or "").lower()
                        if caller_name.lower() not in cn:
                            continue
                    if disconnect_reason:
                        dr = str(s.get("disconnectReason") or s.get("disconnect_reason") or "").lower()
                        if disconnect_reason.lower() not in dr:
                            continue
                    if sentiment:
                        sent = str(s.get("sentiment") or s.get("sentiment") or "").lower()
                        if sentiment.lower() != sent:
                            continue
                    if call_type and call_type.lower() not in ("all", ""):
                        ct = str(s.get("channel") or s.get("channel") or "").lower()
                        if "transfer" in call_type.lower() and "transfer" not in ct:
                            continue
                        if call_type.lower() == "web_call" and "web" not in ct:
                            continue
                        if call_type.lower() == "inbound" and "inbound" not in ct:
                            continue
                        if call_type.lower() == "outbound" and "outbound" not in ct:
                            continue
                    if duration_min is not None:
                        dur = int(s.get("durationSec") or s.get("duration_sec") or 0)
                        if dur < duration_min:
                            continue
                    if duration_max is not None:
                        dur = int(s.get("durationSec") or s.get("duration_sec") or 0)
                        if dur > duration_max:
                            continue

                    filtered_sessions.append({
                        "id": s.get("id"),
                        "agentId": s_agent_id,
                        "agentName": s.get("agentName") or s.get("agent_name"),
                        "callerNumber": s.get("callerNumber") or s.get("caller_number"),
                        "calleeNumber": s.get("calleeNumber") or s.get("callee_number"),
                        "callerName": s.get("callerName") or s.get("caller_name"),
                        "channel": s.get("channel"),
                        "status": s.get("status"),
                        "durationSec": s.get("durationSec") or s.get("duration_sec"),
                        "costTotal": float(s.get("costTotal") or s.get("cost_total") or 0.0),
                        "summary": s.get("summary"),
                        "recordingUrl": s.get("recordingUrl") or s.get("recording_url"),
                        "disconnectReason": s.get("disconnectReason") or s.get("disconnect_reason"),
                        "errorMessage": s.get("errorMessage") or s.get("error_message"),
                        "sentiment": s.get("sentiment"),
                        "startedAt": s.get("startedAt") or s.get("started_at"),
                        "endedAt": s.get("endedAt") or s.get("ended_at"),
                        "createdAt": s.get("createdAt") or s.get("created_at"),
                        "metadata": s.get("metadata") or {}
                    })

                if not filtered_sessions:
                    return build_local_fallback()

                filtered_sessions.sort(key=lambda x: str(x.get("createdAt") or x.get("startedAt") or ""), reverse=True)
                start_idx = (page - 1) * page_size
                end_idx = start_idx + page_size
                paged_sessions = filtered_sessions[start_idx:end_idx]
                return {"data": {"callSessions": paged_sessions, "totalCount": len(filtered_sessions)}}
            else:
                return build_local_fallback()
        except Exception as e:
            return build_local_fallback()


@router.get("/calling/call-sessions")
async def list_call_sessions(
    request: Request,
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
    _forceRefresh: Optional[bool] = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Renders purely off Ravan AI Call Sessions dynamically, using hybrid local filtering
    so internal logic hashes aren't sent directly to Ravan (which causes 0-length responses).
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    url = "https://api.ravan.ai/api/v1/calling/call-sessions"
    
    # We fetch enough records from Ravan to apply local filtering safely
    params = {"page_size": 2000}
    if status and status.lower() != "all":
        params["status"] = status
    if channel and channel.lower() != "all":
        params["channel"] = channel
    if search:
        params["search"] = search
        
    # Build target agent UUIDs BEFORE any network calls
    target_agent_uuids = set()
    if current_user.role != 'admin':
        agent_uuids = [current_user.ravan_agent_id] if current_user.ravan_agent_id else []
        assigned_records = db.exec(select(Assign_Agents.agent_id).where(Assign_Agents.user_id == current_user.id)).all()
        agent_uuids.extend(assigned_records)
        from app.models.domain import Assign_Campaigns
        assigned_campaigns = db.exec(select(Assign_Campaigns.agent_id).where(Assign_Campaigns.user_id == current_user.id)).all()
        agent_uuids.extend([c for c in assigned_campaigns if c is not None])
        target_agent_uuids = set(filter(None, agent_uuids))
        print(f"[CallSessions] User {current_user.email} → target_agent_uuids: {target_agent_uuids}")

    def build_local_fallback():
        """Serve calls from local PostgreSQL CallRecord when Ravan is unavailable."""
        q = select(CallRecord)
        if target_agent_uuids:
            q = q.where(CallRecord.agent_id.in_(target_agent_uuids))
        if status and status.lower() != "all":
            q = q.where(CallRecord.status == status)
        if caller_number:
            q = q.where((CallRecord.caller_number.contains(caller_number)) | (CallRecord.callee_number.contains(caller_number)))
        local_recs = db.exec(q.order_by(CallRecord.created_at.desc())).all()
        sessions = []
        for r in local_recs:
            sessions.append({
                "id": r.call_id,
                "agentId": r.agent_id,
                "agentName": r.agent_name,
                "callerNumber": r.caller_number,
                "calleeNumber": r.callee_number,
                "callerName": r.caller_name,
                "channel": r.channel,
                "status": r.status,
                "durationSec": r.duration_sec,
                "costTotal": r.cost,
                "summary": r.summary,
                "recordingUrl": r.recording_url,
                "disconnectReason": r.disconnect_reason,
                "errorMessage": r.error_message,
                "startedAt": str(r.started_at) if r.started_at else None,
                "endedAt": str(r.ended_at) if r.ended_at else None,
                "createdAt": str(r.created_at),
                "metadata": {}
            })
        total = len(sessions)
        start_idx = (page - 1) * page_size
        paged = sessions[start_idx: start_idx + page_size]
        print(f"[CallSessions] Local PostgreSQL fallback served {len(paged)} of {total} records.")
        return {"data": {"callSessions": paged, "totalCount": total}}

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(url, params=params, headers={"X-Api-Key": api_key, "Accept": "application/json"})
            print(f"[CallSessions] Ravan responded: HTTP {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                s_list = data.get("data", {}).get("callSessions", []) if isinstance(data.get("data"), dict) else (data.get("calls", []) or data.get("data", []))
                if isinstance(s_list, dict):
                    s_list = s_list.get("callSessions", []) or []
                
                filtered_sessions = []

                for s in s_list:
                    # Secure Backend Sandbox Mapping -> Expose contacts strictly mapped to Agent arrays
                    if current_user.role != 'admin' and target_agent_uuids:
                        s_agent_id = str(s.get("agentId") or s.get("agent_id") or "")
                        if s_agent_id not in target_agent_uuids:
                            continue
                            
                    # Apply caller_number filter if set
                    if caller_number:
                        c1 = str(s.get("callerNumber") or s.get("caller_number") or "")
                        c2 = str(s.get("calleeNumber") or s.get("callee_number") or "")
                        if caller_number not in c1 and caller_number not in c2:
                            continue
                            
                    filtered_sessions.append({
                        "id": s.get("id"),
                        "agentId": s.get("agentId") or s.get("agent_id"),
                        "agentName": s.get("agentName") or s.get("agent_name"),
                        "callerNumber": s.get("callerNumber") or s.get("caller_number"),
                        "calleeNumber": s.get("calleeNumber") or s.get("callee_number"),
                        "callerName": s.get("callerName") or s.get("caller_name"),
                        "channel": s.get("channel"),
                        "status": s.get("status"),
                        "durationSec": s.get("durationSec") or s.get("duration_sec"),
                        "costTotal": float(s.get("costTotal") or s.get("cost_total") or 0.0),
                        "summary": s.get("summary"),
                        "recordingUrl": s.get("recordingUrl") or s.get("recording_url"),
                        "disconnectReason": s.get("disconnectReason") or s.get("disconnect_reason"),
                        "errorMessage": s.get("errorMessage") or s.get("error_message"),
                        "startedAt": s.get("startedAt") or s.get("started_at"),
                        "endedAt": s.get("endedAt") or s.get("ended_at"),
                        "createdAt": s.get("createdAt") or s.get("created_at"),
                        "metadata": s.get("metadata") or {}
                    })
                
                print(f"[CallSessions] Ravan returned {len(s_list)} raw, {len(filtered_sessions)} after agent filter.")
                
                # If Ravan returned 200 but zero filtered results, also try local DB as supplement
                if not filtered_sessions:
                    print("[CallSessions] Ravan gave 0 filtered results. Trying local PostgreSQL CallRecord fallback...")
                    return build_local_fallback()
                
                filtered_sessions.sort(key=lambda x: str(x.get("createdAt") or x.get("startedAt") or ""), reverse=True)
                start_idx = (page - 1) * page_size
                end_idx = start_idx + page_size
                paged_sessions = filtered_sessions[start_idx:end_idx]
                
                return {
                    "data": {
                        "callSessions": paged_sessions,
                        "totalCount": len(filtered_sessions)
                    }
                }
            else:
                # Non-200 from Ravan (401, 500, etc.) → fallback to local DB
                print(f"[CallSessions] Ravan returned {resp.status_code}. Using local PostgreSQL CallRecord fallback.")
                return build_local_fallback()
        except Exception as e:
            print(f"[CallSessions] Exception: {e}. Using local PostgreSQL CallRecord fallback.")
            return build_local_fallback()

@router.get("/calling/phone-history")
async def get_phone_history(
    phone: str,
    page: int = 1,
    page_size: int = 20,
    include_transcripts: bool = False,
    agent_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Renders purely off Ravan AI Call phone history dynamically natively, 
    using hybrid local client mapping sandboxing.
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    url = "https://api.ravan.ai/api/v1/calling/phone-history"
    
    # We DO NOT send `agent_id` to Ravan, we just fetch based on phone
    params = {
        "phone": phone,
        "page": 1,
        "page_size": 100, # fetch enough to sandbox natively
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(url, params=params, headers={"X-Api-Key": api_key, "Accept": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                calls = data.get("calls") or data.get("data", {}).get("calls", [])
                if not calls and isinstance(data.get("data"), list):
                    calls = data["data"]
                # Bulk generate security matrix once natively
                target_agent_uuids = set()
                if current_user.role != 'admin':
                    agent_uuids = [current_user.ravan_agent_id] if current_user.ravan_agent_id else []
                    assigned_records = db.exec(select(Assign_Agents.agent_id).where(Assign_Agents.user_id == current_user.id)).all()
                    agent_uuids.extend(assigned_records)
                    target_agent_uuids = set(agent_uuids)
                    
                filtered_calls = []
                for c in calls:
                    # Secure Backend Sandbox Mapping -> Expose contacts strictly mapped to target_agent_uuids
                    if current_user.role != 'admin':
                        c_agent_id = str(c.get("agentId") or c.get("agent_id") or "")
                        
                        if c_agent_id not in target_agent_uuids:
                            continue # skip records from cross-tenants securely
                    
                    # mapping backend model style to UI expected model style just in case:
                    mapped_call = {
                        "id": c.get("id"),
                        "status": c.get("status"),
                        "durationSec": c.get("durationSec") or c.get("duration_sec"),
                        "costTotal": float(c.get("costTotal") or c.get("cost_total") or 0.0),
                        "summary": c.get("summary"),
                        "startedAt": c.get("startedAt") or c.get("started_at"),
                        "createdAt": c.get("createdAt") or c.get("created_at")
                    }
                    if include_transcripts and c.get("transcripts"):
                        mapped_call["transcripts"] = c.get("transcripts")
                        
                    filtered_calls.append(mapped_call)
                
                # Apply local pagination
                start_idx = (page - 1) * page_size
                end_idx = start_idx + page_size
                paged_calls = filtered_calls[start_idx:end_idx]
                
                return {
                    "data": {
                        "calls": paged_calls,
                        "total_count": len(filtered_calls)
                    }
                }
            else:
                raise HTTPException(status_code=resp.status_code, detail=f"Ravan Phone History Error: {resp.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

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
async def get_call_session_detail(session_id: str, db: Session = Depends(get_session)):
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    
    def normalize_transcripts(transcripts):
        if not transcripts:
            return []
        normalized = []
        for item in transcripts:
            if isinstance(item, dict):
                new_item = dict(item)
                msg = item.get("message")
                if isinstance(msg, dict):
                    if "role" not in new_item and "role" in msg:
                        new_item["role"] = msg["role"]
                    if "content" not in new_item and "content" in msg:
                        new_item["content"] = msg["content"]
                normalized.append(new_item)
            else:
                normalized.append(item)
        return normalized

    def build_local_detail_fallback():
        from app.models.domain import CallRecord
        from sqlmodel import select
        r = db.exec(select(CallRecord).where(CallRecord.call_id == session_id)).first()
        if r:
            try:
                tx = json.loads(r.transcript) if r.transcript else []
            except Exception:
                tx = []
            return {
                "success": True,
                "data": {
                    "id": r.call_id,
                    "agent_id": r.agent_id,
                    "agentName": r.agent_name,
                    "agent_name": r.agent_name,
                    "caller_number": r.caller_number,
                    "callee_number": r.callee_number,
                    "callerName": r.caller_name,
                    "caller_name": r.caller_name,
                    "channel": r.channel,
                    "status": r.status,
                    "durationSec": r.duration_sec,
                    "duration_sec": r.duration_sec,
                    "costTotal": r.cost,
                    "recording_url": r.recording_url,
                    "disconnectReason": r.disconnect_reason,
                    "transcripts": normalize_transcripts(tx),
                    "credit_breakdown": {
                        "Channel": r.channel or "voice",
                        "Duration Sec": r.duration_sec,
                        "Total Credits": r.credits_used or r.cost
                    }
                }
            }
        raise HTTPException(status_code=404, detail="Call session details not found in Ravan nor in local postgres DB.")

    if not api_key:
        return build_local_detail_fallback()

    url = f"https://api.ravan.ai/api/v1/calling/call-sessions-detail/{session_id}"
    
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                res_json = response.json()
                if isinstance(res_json, dict):
                    if "data" in res_json and isinstance(res_json["data"], dict):
                        session_data = res_json["data"]
                        session_data["transcripts"] = normalize_transcripts(session_data.get("transcripts"))
                        session_data["recording_url"] = session_data.get("recording_url") or session_data.get("recordingUrl")
                        if "credit_breakdown" not in session_data:
                            session_data["credit_breakdown"] = {
                                "Channel": session_data.get("channel") or "voice",
                                "Duration Sec": session_data.get("duration_sec") or session_data.get("durationSec") or 0,
                                "Total Credits": session_data.get("cost_total") or session_data.get("costTotal") or session_data.get("credits_used") or 0.0
                            }
                    else:
                        res_json["transcripts"] = normalize_transcripts(res_json.get("transcripts"))
                        res_json["recording_url"] = res_json.get("recording_url") or res_json.get("recordingUrl")
                        if "credit_breakdown" not in res_json:
                            res_json["credit_breakdown"] = {
                                "Channel": res_json.get("channel") or "voice",
                                "Duration Sec": res_json.get("duration_sec") or res_json.get("durationSec") or 0,
                                "Total Credits": res_json.get("cost_total") or res_json.get("costTotal") or res_json.get("credits_used") or 0.0
                            }
                return res_json
            else:
                print(f"[CallSessionDetail] Ravan responded with {response.status_code}. Using local Postgres fallback.")
                return build_local_detail_fallback()
        except Exception as e:
            print(f"[CallSessionDetail] Exception fetching from Ravan: {e}. Using local Postgres fallback.")
            return build_local_detail_fallback()


@router.post("/calling/finalize-session/{session_id}")
async def finalize_call_session(session_id: str):
    """
    Called strictly once by the frontend immediately after a call ends (from WebRTC disconnect or explicit hangup).
    Fetches the precise final detail from Ravan, maps it locally, calculates cost, and returns to frontend.
    This entirely prevents frontend polling!
    """
    api_key = os.environ.get("RAVAN_API_KEY", settings.RAVAN_AGNI_AI)
    url = f"https://api.ravan.ai/api/v1/calling/call-sessions-detail/{session_id}"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers={"X-Api-Key": api_key, "Accept": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                # Unpack if wrapped in 'data'
                session_data = data.get("data") if "data" in data else data
                
                # Hand over to robust exact-cost DB injection service
                from app.services.call_service import process_post_call_webhook
                record = await process_post_call_webhook(session_data)
                
                # Wipe cache immediately so next UI load instantly reflects the finalized records
                from app.core.redis_client import delete_cache
                await delete_cache("call_sessions")
                await delete_cache("dashboard")
                
                return {"success": True, "data": session_data, "local_record": record.model_dump() if record else None}
            else:
                raise HTTPException(status_code=resp.status_code, detail=f"Failed to finalize session details: {resp.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Network error finalizing call session: {str(e)}")

from app.models.domain import InboundCampaign

@router.get("/inbound-campaigns")
async def get_inbound_campaigns(session: Session = Depends(get_session)):
    campaigns = session.exec(select(InboundCampaign)).all()
    return {"status": "success", "data": campaigns}

class CreateInboundPayload(BaseModel):
    phone_number: str
    agent_id: str
    agent_name: str
    timezone: str
    max_concurrent: int
    budget_credits: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    window_start: Optional[str] = None
    window_end: Optional[str] = None
    active_days: str

@router.post("/inbound-campaigns/create")
async def create_inbound_campaign(payload: CreateInboundPayload, session: Session = Depends(get_session)):
    # Persist locally
    new_inbound = InboundCampaign(
        phone_number=payload.phone_number,
        agent_id=payload.agent_id,
        agent_name=payload.agent_name,
        timezone=payload.timezone,
        max_concurrent=payload.max_concurrent,
        budget_credits=payload.budget_credits,
        start_date=payload.start_date,
        end_date=payload.end_date,
        window_start=payload.window_start,
        window_end=payload.window_end,
        active_days=payload.active_days
    )
    session.add(new_inbound)
    session.commit()
    session.refresh(new_inbound)
    
    # Bridge route mapping directly on Ravan.ai API wrapper
    async with httpx.AsyncClient() as client:
        try:
            encoded_number = urllib.parse.quote(payload.phone_number)
            ravan_res = await client.patch(
                f"https://api.ravan.ai/api/v1/phone-numbers/{encoded_number}/",
                json={
                    "inboundAgentId": payload.agent_id,
                    "inbound_agent_id": payload.agent_id,
                    "agent_id": payload.agent_id
                },
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            print(f"Ravan Inbound Linkage response: {ravan_res.status_code} - {ravan_res.text}")
        except Exception as e:
            print(f"Failed to propagate inbound routing to Ravan.ai: {str(e)}")
            
    return {"status": "success", "message": "Inbound campaign routed successfully", "data": new_inbound}

@router.post("/inbound-campaigns/{cid}/pause")
async def pause_inbound_campaign(cid: int, session: Session = Depends(get_session)):
    obj = session.get(InboundCampaign, cid)
    if not obj: raise HTTPException(status_code=404, detail="Inbound campaign not found.")
    obj.status = "Paused"
    session.add(obj)
    session.commit()
    return {"status": "success"}

@router.post("/inbound-campaigns/{cid}/resume")
async def resume_inbound_campaign(cid: int, session: Session = Depends(get_session)):
    obj = session.get(InboundCampaign, cid)
    if not obj: raise HTTPException(status_code=404, detail="Inbound campaign not found.")
    obj.status = "Live"
    session.add(obj)
    session.commit()
    return {"status": "success"}

@router.delete("/inbound-campaigns/{cid}")
async def delete_inbound_campaign(cid: int, session: Session = Depends(get_session)):
    obj = session.get(InboundCampaign, cid)
    if not obj: raise HTTPException(status_code=404, detail="Inbound campaign not found.")
    
    # Unlink route mapping directly on Ravan.ai API wrapper
    async with httpx.AsyncClient() as client:
        try:
            encoded_number = urllib.parse.quote(obj.phone_number)
            await client.patch(
                f"https://api.ravan.ai/api/v1/phone-numbers/{encoded_number}/",
                json={
                    "inboundAgentId": None,
                    "inbound_agent_id": None,
                    "agent_id": None
                },
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
        except Exception as e:
            print(f"Failed to clear inbound routing on Ravan.ai: {str(e)}")
            
    session.delete(obj)
    session.commit()
    return {"status": "success"}
