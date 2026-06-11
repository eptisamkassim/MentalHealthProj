from pydantic import BaseModel
from typing import Optional

class ChatMessageRequest (BaseModel):
    conversation_id: Optional[str]
    user_id: str
    message: str
