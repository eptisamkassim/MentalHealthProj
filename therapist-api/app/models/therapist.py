from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from app.models.base import Base
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid


class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    specialty = Column(ARRAY(String), default=[])
    bio = Column(Text)
    insurance_list = Column(ARRAY(String), default=[])
    location = Column(String, default="Boston")
    therapy_type = Column(ARRAY(String), default=[])
    bio_embedding = Column(Vector(1536))  # For semantic search
    accepting_new_clients = Column(Boolean, default=None)
    session_type = Column(String, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Therapist(id={self.id}, name={self.name})>"
    