import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.domain import User

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.get("/profile")
async def get_org_profile(request: Request, current_user: User = Depends(get_current_user)):
    return {
        "success": True, 
        "data": {
            "id": "aotms-global-private-limited-1784615347",
            "name": "Acme Inc",
            "slug": "acme-inc",
            "website": "https://acme.com",
            "status": "ACTIVE",
            "total_credits": 1250.5,
            "region_id": "us-east",
            "plan_name": "Pro",
            "max_concurrency": 10,
            "max_members": 25,
            "max_agents": 15,
            "max_credits": 50000,
            "api_rate_limit": 120,
            "can_record_calls": True,
            "can_use_api": True
        }
    }
