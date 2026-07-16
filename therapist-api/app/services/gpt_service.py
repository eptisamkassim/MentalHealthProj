import json
import logging
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class GPTService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) # Create once per instance 

    @staticmethod
    def create_conversation():
        return []

    @staticmethod
    def add_message(conversation: list, role: str, content: str):
        # Add message to conversation
        conversation.append({"role": role, "content": content})
        return conversation

    def get_response(self, conversation: list, user_message: str) -> dict:
        conversation = GPTService.add_message(conversation, "user", user_message)
        system_message = {"role": "system", "content": """You are a warm, empathetic therapist matching assistant. Your goal is to gather info about the user's therapy needs.
                Ask ONE question at a time.

                You need to learn:
                1. The specific insurance provider name (e.g. Blue Cross Blue Shield, Aetna, Cigna, United Healthcare). If the user just says "yes I have insurance" or "I'm insured", 
                          do NOT move on — ask them which provider. If paying out-of-pocket or out of pocket or uninsured, set to 'out of pocket'.
                2. Type of therapy (CBT, DBT, trauma-focused, etc.)
                3. Main concerns/conditions

                When asking about therapy type, if the user doesn't know or seems confused, proactively explain the main approaches:
                - **General therapy**: A flexible approach to discuss emotions, relationships, stress, life changes, or personal challenges.
                - **CBT (Cognitive Behavioral Therapy)**: Helps identify and change unhelpful thoughts and behaviors while building coping skills.
                - **DBT (Dialectical Behavior Therapy)**: Focuses on managing intense emotions, improving relationships, and handling distress in healthy ways.
                - **EMDR (Eye Movement Desensitization and Reprocessing)**: A specialized therapy that helps people process distressing memories in a structured way.
                - **Trauma-focused**: Helps process traumatic experiences and reduce symptoms related to trauma or PTSD.
                - **Psychodynamic**: Explores deeper patterns, past experiences, and root causes of current struggles.
                - **ACT (Acceptance and Commitment Therapy)**: Helps you accept difficult thoughts and feelings while focusing on actions aligned with your values.
                - **Child & Adolescent Therapy**: For children and teens facing emotional, behavioral, school, or family-related challenges.
                
                After each answer, ask the next question naturally. When you have all pieces of info (insurance, therapy type, concern), confirm back in one natural conversational sentence (no bullet points or labels),
                then on a new line say exactly: "Finding matches now"

                If the user says they are paying out of pocket or self-pay, set insurance to 'out of pocket' instead of null.

                Be warm, supportive, and conversational. You are NOT a therapist, counselor, or conversational companion.
                Keep responses concise. Ask one question at a time.

                If the message is completely unrelated to mental health, therapy, or finding a therapist
                (e.g. cooking, sports, trivia), politely redirect them back to finding a therapist.
                Never engage, answer, or roleplay topics outside of finding therapy.
                Do not validate, discuss, or comment on randomness, unrelated trivia, or personal chitchat."""}

        try:
            response = self.client.chat.completions.create(
                model="gpt-4.1-nano",
                max_tokens=256,
                messages=[system_message] + conversation
            )
            assistant_message = response.choices[0].message.content
            conversation = GPTService.add_message(conversation, "assistant", assistant_message)
            return {
                "message": assistant_message,
                "conversation": conversation
            }
        except Exception as e:
            logger.error(f"GPT chat error: {e}")
            raise

    def extract_preferences(self, conversation: list) -> dict:
        messages_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])

        system_prompt = """Extract user preferences from the conversation in JSON format.
        Return ONLY valid JSON with these fields:
        - insurance (string or null): the specific insurance provider name, or "out of pocket" if the user is self-paying or uninsured. Never return null if the user mentioned any form of payment or insurance.
        - therapy_type (string or null)
        - concerns (array of strings, never null — use [] if not mentioned)
        - availability (string or null)"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4.1-nano",
                max_tokens=256,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": messages_text}
                ]
            )
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            logger.warning("Failed to parse preferences JSON from GPT response")
            return {}
        except Exception as e:
            logger.error(f"GPT preference extraction error: {e}")
            return {}

    def generate_email(self, therapist, user_preferences, user_name, user_email):
        user_message = f"""
        Therapist name: {therapist.name}
        Therapist specialties: {therapist.specialty}
        Therapist insurance: {therapist.insurance_list}

        Patient name: {user_name}
        Patient insurance: {user_preferences['insurance']}
        Patient concerns: {user_preferences['concerns']}
        Patient availability: {user_preferences['availability']}
        Patient email: {user_email}
        """

        system_prompt = """Write a short, friendly email from a person reaching out to a therapist for the first time.
        It should sound like a real person wrote it — natural, warm, and conversational. Not stiff or corporate.
        Cover these points casually: whether the therapist is taking new patients, whether they accept the person's insurance,
        a brief mention of what they're dealing with, and their general availability. Keep it short
        Also include exactly 3 talking points — questions to ask during the consultation to understand the therapist's 
        therapeutic approach and how they work. Do NOT include questions about availability, scheduling, session format 
        (in-person/virtual), or insurance — those are already handled. Focus on how they approach treatment, their style, 
        and how they tailor therapy to the individual. Talking points should NOT be in the email body — they are separate.
        Return only a JSON object with these exact keys:
            - email_subject
            - email_body
            - talking_points (array of strings)"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4.1-nano",
                max_tokens=600,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            logger.warning("Failed to parse email JSON from GPT response")
            return {}
        except Exception as e:
            logger.error(f"GPT email generation error: {e}")
            return {}

    def transcribe(self, file_bytes: bytes) -> str:
        try:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=("audio.webm", file_bytes, "audio/webm")
            )
            return transcript.text
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise