import httpx
from fastapi import APIRouter, HTTPException, Query, Depends, Request
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.domain import User, Assign_Agents
from app.database.connection import get_session
from sqlmodel import Session

router = APIRouter(prefix="/agents", tags=["agents"])

# Ensure we always strip trailing slashes internally, as ravan uses strict trailing slashes on some endpoints
from fastapi import Query

@router.get("/")
async def list_agents(
    limit: int = Query(10, description="Number of results to return"), 
    offset: int = Query(0, description="Pagination offset"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    from app.core.redis_client import get_cache, set_cache, generate_cache_key, delete_cache
    
    # Structural Cache Hit lookup natively
    cache_key = generate_cache_key("agents_list", limit=limit, offset=offset)
    
    async with httpx.AsyncClient() as client:
        try:
            # Multi-Tenant Core Validation Strategy
            if current_user.role == "admin":
                cached = await get_cache(cache_key)
                if cached: 
                    print("⚡ REDIS CACHE HIT: Bypassed Ravan.ai - Extracted agents array natively in <1ms!")
                    return cached
                
                # Admins can query the entire fleet array natively
                response = await client.get(
                    f"https://api.ravan.ai/api/v1/agents/?limit={limit}&offset={offset}",
                    headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
                )
                response.raise_for_status()
                data = response.json()
                await set_cache(cache_key, data, 600)
                return data
            else:
                # Customers can have multiple agents now due to 'agent_quota' arrays natively. 
                # We structurally fetch the master list securely and execute rigorous Identity Hash mappings natively.
                cached_global = await get_cache(cache_key)
                if not cached_global:
                    response = await client.get(
                        f"https://api.ravan.ai/api/v1/agents/?limit={limit}&offset={offset}",
                        headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
                    )
                    response.raise_for_status()
                    cached_global = response.json()
                    await set_cache(cache_key, cached_global, 600)
                
                # Natively map all matching nodes assigned mapped securely exclusively against tenant Identity Hashes!
                raw_data = cached_global.get("data", []) if isinstance(cached_global, dict) else cached_global
                from sqlmodel import select
                
                agent_uuids = [current_user.ravan_agent_id] if current_user.ravan_agent_id else []
                assigned_records = db.exec(select(Assign_Agents.agent_id).where(Assign_Agents.user_id == current_user.id)).all()
                agent_uuids.extend(assigned_records)
                target_agent_uuids = set(agent_uuids)

                safe_agents = [
                    a for a in raw_data 
                    if a.get("id") in target_agent_uuids
                ]
                
                # Deliver completely sandboxed payload structure array internally mapping limits perfectly back.
                return {"success": True, "message": "Secure payload structurally mapped", "data": safe_agents, "meta": {"total": str(len(safe_agents))}}
            
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Fetch Error: {e.response.text}")
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
        
    if current_user.role != 'admin':
        from app.core.redis_client import get_cache, generate_cache_key
        cache_key = generate_cache_key("agents_list", limit=1000, offset=0)
        cached = await get_cache(cache_key)
        
        from sqlmodel import select
        agent_uuids = [current_user.ravan_agent_id] if current_user.ravan_agent_id else []
        assigned_records = db.exec(select(Assign_Agents.agent_id).where(Assign_Agents.user_id == current_user.id)).all()
        agent_uuids.extend(assigned_records)
        target_agent_uuids = set(agent_uuids)
        
        my_agents = []
        if cached and "data" in cached:
            my_agents = [a for a in cached["data"] if a.get("id") in target_agent_uuids]
        else:
            async with httpx.AsyncClient() as c:
                try:
                    resp = await c.get("https://api.ravan.ai/api/v1/agents/?limit=1000&offset=0", headers={"X-Api-Key": settings.RAVAN_AGNI_AI})
                    if resp.status_code == 200:
                        all_ag = resp.json().get("data", [])
                        my_agents = [a for a in all_ag if a.get("id") in target_agent_uuids]
                except:
                    pass
                    
        allowed_quota = current_user.agent_quota if current_user.agent_quota > 0 else 1
        if len(my_agents) >= allowed_quota:
            raise HTTPException(status_code=400, detail=f"Agents Limits {len(my_agents)}/{allowed_quota}. Active allowed quota reached. Upgrade your plan to spin up more nodes.")

    async with httpx.AsyncClient() as client:
        try:
            # --- Dynamic Node Telemetry Validation ---
            # Ravan API explicitly rejects internal UUIDs. We must rigorously enforce Text-Literal fallbacks!
            dynamic_model = "Agni Premium"
            dynamic_voice = "Iris"

            secured_agent_name = request_data.get("agentName", "Unnamed Agent").split(" [HASH:")[0]

            # We must explicitly build the massive exhaustive payload for Ravan compliance dynamically.
            raw_payload = {
                "organizationId": request_data.get("organizationId"),
                "agentName": secured_agent_name,
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
            
            # Autowire this fallback natively back down into PostgreSQL for the customer (ONLY if empty, preventing Legacy node orphan overwrites!)
            if current_user.role != 'admin' and new_agent_id and not current_user.ravan_agent_id:
                current_user.ravan_agent_id = new_agent_id
                db.add(current_user)
                db.commit()
                
            # Log into Assign_Agents mapping unconditionally so admin knows its details
            if new_agent_id:
                new_assignment = Assign_Agents(
                    agent_id=new_agent_id,
                    user_id=current_user.id,
                    customer_name=current_user.name,
                    customer_email=current_user.email
                )
                db.add(new_assignment)
                db.commit()
                
            # Flush Native Cache mapping arrays immediately
            from app.core.redis_client import delete_cache
            await delete_cache("agents_list")
                
            return response_json
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan AI Provisioning Reject: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/voices")
async def get_available_voices():
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    from app.core.redis_client import get_cache, set_cache, generate_cache_key
    cache_key = "ravan_voices"
    cached = await get_cache(cache_key)
    if cached:
        print("⚡ REDIS CACHE HIT: Bypassed Ravan.ai - Extracted voices natively in <1ms!")
        return cached

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.ravan.ai/api/v1/available-llm-models/with-voices?limit=100&offset=0",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            data = response.json()
            await set_cache(cache_key, data, 3600)  # Cache voices for 1 hour
            return data
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    from app.core.redis_client import get_cache, set_cache, generate_cache_key
    cache_key = generate_cache_key("agent_detail_struct", agent_id=agent_id)
    cached = await get_cache(cache_key)
    if cached:
        print(f"⚡ REDIS CACHE HIT: Bypassed Ravan.ai - Extracted agent {agent_id} natively in <1ms!")
        return cached

    async with httpx.AsyncClient() as client:
        try:
            # Trailing slash is explicitly required by Ravan's specification for UUID lookups
            response = await client.get(
                f"https://api.ravan.ai/api/v1/agents/{agent_id}/",
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            data = response.json()
            await set_cache(cache_key, data, 600)
            return data
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
                
            # Also clean up from mapping tables Assign_Agents and Assign_Campaigns
            from app.models.domain import Assign_Agents, Assign_Campaigns
            
            assigned_agents = db.exec(select(Assign_Agents).where(Assign_Agents.agent_id == agent_id)).all()
            for aa in assigned_agents:
                db.delete(aa)
                
            assigned_campaigns = db.exec(select(Assign_Campaigns).where(Assign_Campaigns.agent_id == agent_id)).all()
            for ac in assigned_campaigns:
                if ac.agent_id == agent_id: # Extra safety check though .where() caught it
                    ac.agent_id = None
                    db.add(ac)
                    
            db.commit()
                
            # Flush cache dynamically
            from app.core.redis_client import delete_cache, generate_cache_key
            await delete_cache("agents_list")
            await delete_cache(generate_cache_key("agent_single", agent_id=agent_id))
            await delete_cache(generate_cache_key("agent_detail_struct", agent_id=agent_id))
            
            # The API returns a success message
            return {"success": True, "message": f"Agent {agent_id} obliterated successfully."}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/assigned-agents/list")
async def get_assigned_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from sqlmodel import select
    from app.models.domain import Assign_Agents
    try:
        assignments = db.exec(select(Assign_Agents).order_by(Assign_Agents.created_at.desc())).all()
        return {"data": assignments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{agent_id}")
async def update_agent(
    agent_id: str, 
    request_data: dict,
    current_user: User = Depends(get_current_user)
):
    if not settings.RAVAN_AGNI_AI:
        raise HTTPException(status_code=500, detail="RAVAN_AGNI_AI key not configured in backend.")
        
    # Permanently secure Platform ID upon edits
    if "agentName" in request_data and current_user.role != 'admin':
        request_data["agentName"] = request_data["agentName"].split(" [HASH:")[0]

    async with httpx.AsyncClient() as client:
        try:
            response = await client.patch(
                f"https://api.ravan.ai/api/v1/agents/{agent_id}/",
                json=request_data,
                headers={"X-Api-Key": settings.RAVAN_AGNI_AI}
            )
            response.raise_for_status()
            from app.core.redis_client import delete_cache, generate_cache_key
            await delete_cache("agents_list")
            await delete_cache(generate_cache_key("agent_single", agent_id=agent_id))
            await delete_cache(generate_cache_key("agent_detail_struct", agent_id=agent_id))
            return {"success": True, "status": request_data.get("status", "ACTIVE")}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Ravan API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
