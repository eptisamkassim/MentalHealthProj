from pydantic import BaseModel
from fastapi import APIRouter,  HTTPException, Depends
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.outreach import Outreach

router = APIRouter()

class OutreachRequest(BaseModel):
    user_id: str
    therapist_id: str
    status: str


@router.post("/")
async def outreach_entry(data: OutreachRequest, db: Session = Depends(get_db)):
    ## create new user outreach and save to db
    new_outreach = Outreach(
        user_id = data.user_id,
        therapist_id = data.therapist_id,
        status = data.status,
    )
    db.add(new_outreach)
    db.commit()

    return {"id": str(new_outreach.id), 
            "status": new_outreach.status}


## Query param as user id since no auth
@router.get("/")
async def get_outreach(user_id: str, db: Session = Depends(get_db)):
    outreach = db.query(Outreach).filter(Outreach.user_id == user_id).all()

    if not outreach:
        raise HTTPException(status_code=404, detail="Failed to find Outreach")

    return outreach
