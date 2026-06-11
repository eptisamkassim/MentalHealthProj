from pydantic import BaseModel
from fastapi import APIRouter,  HTTPException, Depends
from app.database import get_db
from sqlalchemy.orm import Session
from app.services.gpt_service import GPTService
from app.models.conversation import Conversation
from app.models.therapist import Therapist

router = APIRouter()
gpt_service = GPTService()

class EmailRequest(BaseModel):
        therapist_id: str
        conversation_id: str
        user_name: str
        user_email: str = ""
        user_phone_number: str = ""
        user_preferences: dict = None


@router.post("/draft")
async def draft_email(data: EmailRequest, db: Session = Depends(get_db)):
        therapist = db.query(Therapist).filter(Therapist.id == data.therapist_id).first()

        if therapist is None:
                raise HTTPException(status_code=404, detail="Therapist not found")

        conversation = db.query(Conversation).filter(Conversation.id == data.conversation_id).first()

        if conversation is None:
                raise HTTPException(status_code=404, detail="Conversation not found")

        preferences = conversation.preference or data.user_preferences


        result = gpt_service.generate_email(therapist, preferences, data.user_name, data.user_email, data.user_phone_number)

        return result

