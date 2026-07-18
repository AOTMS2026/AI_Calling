from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database.connection import get_session
from app.models.domain import Call

router = APIRouter(prefix="/calls", tags=["calls"])

@router.get("/history")
def get_call_history(db: Session = Depends(get_session)):
    calls = db.exec(select(Call)).all()
    return calls
