from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database.connection import get_session
from app.api.dependencies import get_current_user
from app.models.domain import User, DashboardMetrics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/metrics")
async def get_dashboard_metrics(db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Base fallback metrics
    metrics = {
        "total_cost": 0.0,
        "total_calls": 0,
        "total_duration_sec": 0,
        "success_calls": 0,
        "failed_calls": 0,
        "success_rate": 0
    }
    
    # 1. First load from local DB (for inbound or manual local calls)
    local_metric = db.exec(select(DashboardMetrics).where(DashboardMetrics.agent_id == current_user.ravan_agent_id)).first()
    if local_metric:
        metrics["total_cost"] = local_metric.total_cost or 0
        metrics["total_calls"] = local_metric.total_calls or 0
        metrics["total_duration_sec"] = local_metric.total_duration_sec or 0
        metrics["success_calls"] = local_metric.success_calls or 0
        metrics["failed_calls"] = local_metric.failed_calls or 0
        
    # 2. Add Live Outbound Metrics from Ravan Campaigns
    from app.core.config import settings
    from app.models.domain import Campaign
    import httpx
    
    # Get user's campaigns to filter
    user_campaigns = db.exec(select(Campaign).where(Campaign.user_id == current_user.id)).all()
    user_campaign_ids = {c.id for c in user_campaigns}
    
    if settings.RAVAN_AGNI_AI and user_campaign_ids:
        try:
            url = f"https://api.ravan.ai/api/v1/campaigns/?limit=100"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers={"X-Api-Key": settings.RAVAN_AGNI_AI, "Accept": "application/json"})
                if resp.status_code == 200:
                    r_data = resp.json().get("data", [])
                    for rc in r_data:
                        cid = rc.get("id")
                        if cid not in user_campaign_ids:
                            continue
                            
                        stats = rc.get("contactStats", {})
                        if stats:
                            # Calculate calls made (total - pending)
                            calls_made = stats.get("contacted", 0) + stats.get("failed", 0) + stats.get("noAnswer", 0)
                            succ = stats.get("successful", 0)
                            fail = stats.get("failed", 0) + stats.get("noAnswer", 0)
                            
                            metrics["total_calls"] += calls_made
                            metrics["success_calls"] += succ
                            metrics["failed_calls"] += fail
                            
                            # Assuming 1 Token cost per Outbound dial
                            metrics["total_cost"] += float(calls_made)
        except Exception as e:
            print(f"Failed to aggregate real-time Ravan metrics: {e}")
            pass
            
    # Compute safe success rate
    if metrics["total_calls"] > 0:
        metrics["success_rate"] = round((metrics["success_calls"] / metrics["total_calls"]) * 100, 2)
        
    return {"data": metrics}
