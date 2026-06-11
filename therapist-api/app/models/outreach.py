from sqlalchemy import Column, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from datetime import datetime
import uuid

class Outreach(Base):
    __tablename__ = "outreach"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    therapist_id = Column(UUID(as_uuid=True))
    user_id = Column(UUID(as_uuid=True))
    status = Column(Text)
    email_sent_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User(id={self.id})>"
    

# For MVP the minimum useful fields are:

# id -- primary key
# therapist_id -- which therapist
# user_id -- which user
# status -- pending/replied/scheduled
# email_sent_at -- when they reached out
# created_at -- timestamp