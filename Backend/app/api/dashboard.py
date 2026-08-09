from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database.connection import get_session
from app.api.dependencies import get_current_user
from app.models.domain import User, DashboardMetrics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if not current_user.ravan_agent_id:
        return {"data": {"total_cost": 0.0, "total_calls": 0, "total_duration_sec": 0}}
        
    metric = db.exec(select(DashboardMetrics).where(DashboardMetrics.agent_id == current_user.ravan_agent_id)).first()
    if not metric:
        return {"data": {"total_cost": 0.0, "total_calls": 0, "total_duration_sec": 0}}
        
    return {"data": {
        "total_cost": metric.total_cost,
        "total_calls": metric.total_calls,
        "total_duration_sec": metric.total_duration_sec,
        "success_calls": metric.success_calls,
        "failed_calls": metric.failed_calls
    }}
