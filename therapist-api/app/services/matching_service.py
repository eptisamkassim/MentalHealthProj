from app.services.gpt_service import GPTService
import numpy as np
import json

gpt_service = GPTService()

class MatchingService:
    
    def match(self, therapists, preferences):
        # 1. build text from preferences
        text = f"{preferences.therapy_type} {' '.join(preferences.concerns)}"  # combine therapy_type and concerns
        
        # 2. generate embedding for user preferences
        response = gpt_service.client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        user_embedding = response.data[0].embedding
        
        # 3. score each therapist
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
        # 4. sort by score and return top 10
        scored.sort(key=lambda x: x["score"], reverse=True)

        top_10 = scored[:10]
        promptString= "" 

        for i in top_10:
            promptString += f"Name: {i['therapist']['name']} Specialty: {i['therapist']['specialty']} Therapy Type {i['therapist']['therapy_type']}\n"

        try:
            response = gpt_service.client.chat.completions.create(
                model="gpt-4.1-nano",
                max_tokens=800,
                messages=[
                    {"role": "system", "content": f"For every therapist in the prompt string below mention why they are a good match with the user looking for '{preferences.therapy_type}' for '{preferences.concerns}' in 1. If you are referring to a therapist only use their first name.  Return only a JSON array of 10 strings "},
                    {"role": "user", "content": promptString}
                ]
            )
        except Exception as e:
            return {}

        reasons = json.loads(response.choices[0].message.content)

        for i, result in enumerate(top_10):
            result["therapist"]["match_reason"] = reasons[i]

        return top_10
    
    def cosine_similarity(self, vec1, vec2):
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))