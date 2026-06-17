from pydantic import BaseModel
from fastapi import APIRouter,  HTTPException, Depends
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.outreach import Outreach

router = APIRouter()

class OutreachRequest(BaseModel):
    user_id: str
    therapist_id: str


@router.post("/")
async def outreach_entry(data: OutreachRequest, db: Session = Depends(get_db)):
    new_outreach = Outreach(
        user_id = data.user_id,
        therapist_id = data.therapist_id,
    )
    db.add(new_outreach)
    db.commit()

    return {"id": str(new_outreach.id)}

@router.get("/")
async def get_outreach(user_id: str, db: Session = Depends(get_db)):
    outreach = db.query(Outreach).filter(Outreach.user_id == user_id).all()

    if not outreach:
        raise HTTPException(status_code=404, detail="Failed to find Outreach Info")

    return outreach
