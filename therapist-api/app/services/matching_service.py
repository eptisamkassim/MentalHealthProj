import json
import logging
import numpy as np
from app.services.gpt_service import GPTService

logger = logging.getLogger(__name__)
gpt_service = GPTService()

class MatchingService:

    def match(self, therapists, preferences):
        text = f"{preferences.therapy_type} {' '.join(preferences.concerns)}"

        # Create embeddings from user preferences
        try:
            response = gpt_service.client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            user_embedding = response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            raise

        # Traverse all therapist embeddings to find similar ones to user
        scored = []
        for therapist in therapists:
            similarity = self.cosine_similarity(therapist.bio_embedding, user_embedding)
            scored.append({
                "therapist": {
                    "id": str(therapist.id),
                    "name": therapist.name,
                    "bio": therapist.bio,
                    "specialty": therapist.specialty,
                    "therapy_type": therapist.therapy_type,
                    "insurance_list": therapist.insurance_list,
                    "location": therapist.location,
                    "accepting_new_clients": therapist.accepting_new_clients,
                    "session_type": therapist.session_type
                },
                "score": similarity
            })

        # Get top 10 matches
        scored.sort(key=lambda x: x["score"], reverse=True)
        top_10 = scored[:10]

        prompt_string = ""
        for item in top_10:
            prompt_string += f"Name: {item['therapist']['name']} Specialty: {item['therapist']['specialty']} Therapy Type {item['therapist']['therapy_type']}\n"

        try:
            response = gpt_service.client.chat.completions.create(
                model="gpt-4.1-nano",
                max_tokens=800,
                messages=[
                    {"role": "system", "content": f"For every therapist in the prompt string below mention why they are a good match with the user looking" + 
                        "for {preferences.therapy_type} for {', '.join(preferences.concerns)} in 1 sentence. If you are referring to a therapist only use their first name. Return only a JSON array of strings, one per therapist."},
                    {"role": "user", "content": prompt_string}
                ]
            )
            reasons = json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            logger.warning("Failed to parse match reasons JSON")
            return top_10
        except Exception as e:
            logger.error(f"GPT match reason error: {e}")
            return top_10

        for i, result in enumerate(top_10):
            result["therapist"]["match_reason"] = reasons[i] if i < len(reasons) else ""

        return top_10

    # Calculates similarty between 2 embeddings. Higher number means better match
    def cosine_similarity(self, vec1, vec2):
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))