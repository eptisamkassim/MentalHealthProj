from app.database import SessionLocal
from app.models.therapist import Therapist
from app.database import get_db
from app.services.gpt_service import GPTService


gpt_service = GPTService()
db = SessionLocal()



def create_embeddings(db):
    for therapist in db.query(Therapist).filter(Therapist.bio_embedding == None).all():
        text = f"{therapist.bio} {' '.join(therapist.specialty)} {' '.join(therapist.therapy_type)}"
        
        response = gpt_service.client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding
        therapist.bio_embedding = embedding
        db.add(therapist)
        db.commit()

if __name__ == "__main__":
    create_embeddings(db)

# Connect to the database
# Query all therapists where bio_embedding is None
# For each therapist, build the combined text
# Call OpenAI embeddings API
# Save the embedding back 