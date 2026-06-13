from pydantic import BaseModel
from app.services.gpt_service import GPTService
from app.database import get_db
from fastapi import APIRouter, HTTPException, Depends
from app.models.conversation import Conversation
from app.schemas.chat import ChatMessageRequest
from app.models.user import User
import uuid
from sqlalchemy.orm import Session
import os
from sqlalchemy.orm.attributes import flag_modified


router = APIRouter()
gpt_service = GPTService()

@router.post("/message")
def chat_message(request: ChatMessageRequest, db: Session = Depends(get_db)):
    
    user_exists = db.query(User).filter(User.id == request.user_id).first()

    if user_exists is None:
        new_user = User(
            id = request.user_id,
            email = f"anon_{request.user_id}@placeholder.local"
        )
        db.add(new_user)
        db.commit()
    
    # If conversation_id is None, create new conversation
    if request.conversation_id is None:
        new_conversation = Conversation(
            id=uuid.uuid4(),
            user_id=request.user_id,
            messages=[],
            preference=None
        )
        db.add(new_conversation)
        db.commit()
        conversation = new_conversation
    else:
        # Query for existing conversation
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id
        ).first()
        
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
    
    
    messages = conversation.messages if conversation.messages else []
    
    response = gpt_service.get_response(messages, request.message)
    
    if not response or "message" not in response:
        raise HTTPException(status_code=500, detail="Failed to get response from Claude")
    
    # Update conversation with new messages
    conversation.messages = response["conversation"]
    flag_modified(conversation, "messages")  
    
    # Save to database
    db.add(conversation)
    db.commit()
    
    # Return response
    return {
        "message": response["message"],
        "conversation_id": str(conversation.id)
    }


class MessageParser(BaseModel):
    conversation_id: str

@router.post("/extract-preferences")
async def extract_preferences(data: MessageParser, db: Session = Depends(get_db)):
    
    if data.conversation_id is None:
        raise HTTPException(status_code=404, detail="Conversation ID not found")

    
    # Query for existing conversation
    conversation = db.query(Conversation).filter(
        Conversation.id == data.conversation_id
    ).first()
        
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    response = gpt_service.extract_preferences(conversation.messages)

    conversation.preference = response
    flag_modified(conversation, "preference")
    db.commit()
            
    if not response:
        raise HTTPException(status_code=500, detail="Failed to get response from GPT")
    
    return response
