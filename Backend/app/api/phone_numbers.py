from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.api.dependencies import get_current_user
from app.models.domain import User, PurchasedPhoneNumber
from app.database.connection import get_session
from typing import List

router = APIRouter(prefix="/phone-numbers", tags=["phone-numbers"])

@router.get("/my")
async def get_my_phone_numbers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    records = db.exec(
        select(PurchasedPhoneNumber).where(PurchasedPhoneNumber.user_id == current_user.id)
    ).all()
    
    return {"success": True, "data": records}
