
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.therapist import Therapist
from app.services.matching_service import MatchingService
from app.database import get_db
from typing import Optional

router = APIRouter()
matching_service = MatchingService()

class SearchRequest(BaseModel):
    insurance: str
    therapy_type: str
    concerns: list[str]
    location: Optional[str] = None
    availability: Optional[str] = None

@router.post("/search")
async def search_therapists(data: SearchRequest, db: Session = Depends(get_db)):
    insurance_fallback = False # Ensure Therapist with rare insurance

    if data.insurance.lower() in ["out of pocket", "out-of-pocket"]:
        therapists = db.query(Therapist).all()
    else:
        therapists = db.query(Therapist).filter(Therapist.insurance_list.contains([data.insurance])).all()
        if not therapists:
            therapists = db.query(Therapist).all()
            insurance_fallback = True # No Therapist has this insurance show out-of-pocket therapist

    results = matching_service.match(therapists, data)

    return {"results": results, "insurance_fallback": insurance_fallback, "insurance": data.insurance}