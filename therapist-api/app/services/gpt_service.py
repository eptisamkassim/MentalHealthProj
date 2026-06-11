from openai import OpenAI
from dotenv import load_dotenv
import json
import os

load_dotenv()

class GPTService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # Create once per instance

    @staticmethod
    def create_conversation():
        """Initialize conversation history"""
        return []
    
    @staticmethod
    def add_message(conversation: list, role: str, content: str):
        """Add message to conversation"""
        conversation.append({"role": role, "content": content})
        return conversation
    
    def get_response(self, conversation: list, user_message: str) -> dict:
        
        """Get Claude response"""
        conversation = GPTService.add_message(conversation, "user", user_message)
        system_message = {"role": "system", "content": """You are a warm, empathetic therapist matching assistant. Your goal is to gather info about the user's therapy needs.
                Ask ONE question at a time. 

                You need to learn:
                1. Insurance (or if paying out-of-pocket)
                2. Type of therapy (CBT, DBT, trauma-focused, etc.)
                3. Main concerns/conditions

                When asking about therapy type, if the user doesn't know or seems confused, proactively explain the main approaches:
                - **General therapy**: Just talk and process
                - **CBT (Cognitive Behavioral Therapy)**: Great for anxiety, focuses on thoughts and behaviors
                - **DBT (Dialectical Behavior Therapy)**: For managing intense emotions, emotional regulation
                - **Trauma-focused**: For past trauma, PTSD
                - **Psychodynamic**: Explore root causes, deeper patterns

                After each answer, ask the next question naturally. When you have all 4 pieces of info, summarize what you learned and 
                tell the user: "Finding matches now"
                
                If the user says they are paying out of pocket or self-pay, set insurance to 'out of pocket' instead of null.

                Be warm, supportive, and conversational. You are NOT a therapist, counselor, or conversational companion. 
                Keep responses concise. Ask one question at a time. 
                
                If the message is completely unrelated to mental health, therapy, or finding a therapist 
                (e.g. cooking, sports, trivia), politely redirect them back to finding a therapist.
                Never engage, answer, or roleplay topics outside of finding therapy. 
                Do not validate, discuss, or comment on randomness, unrelated trivia, or personal chitchat."""}

        
        ### model="gpt-4.1-nano"
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
            print(f"GPT API Error: {str(e)}")  # ADD THIS LINE
            # Log the error, return empty dict or raise
            return {}

    
    def extract_preferences(self, conversation: list) -> dict:
        """Extract structured preferences from conversation"""
        messages_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])

        system_prompt = """Extract user preferences from the conversation in JSON format.
        Return ONLY valid JSON with these fields:
        - insurance (string or null)
        - therapy_type (string or null)
        - concerns (array of strings)
        - location (string or null)
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
        except Exception as e:
            return {}
        
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {}

    def generate_email(self, therapist, user_preferences, user_name, user_email, user_phone):

        ## User message with info to write the email
        user_message = f"""
        Therapist name: {therapist.name}
        Therapist specialties: {therapist.specialty}
        Therapist insurance: {therapist.insurance_list}

        Patient name: {user_name}
        Patient insurance: {user_preferences['insurance']}
        Patient concerns: {user_preferences['concerns']}
        Patient availability: {user_preferences['availability']}
        Patient email: {user_email}
        Patient phone: {user_phone}
        """
        
        system_prompt = """Write a polite and professional email requesting a consultation appointment. 
        The email must include the following details: asking if the provider is currently accepting new patients, 
        asking if they accept my insurance (insert insurance type here), listing my symptoms/issues 
        (insert symptoms here), and providing my general availability (insert your availability here). Include talking points as helpful questions to ask during the consultation meeting to ensure match with therapist. Talking points should NOT be included in the email body. They are separate questions for the user to ask during the consultation meeting.
        Keep the tone warm and concise. Return only a JSON object with these exact keys:
            - email_subject
            - email_body  
            - talking_points (array of strings)"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4.1-nano",
                max_tokens=256,
                messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
            )      
        except Exception as e:
            return {}
        
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {}
        
    def transcribe(self, file_bytes: bytes) -> str:
        transcript = self.client.audio.transcriptions.create(
            model="whisper-1",
            file=("audio.webm", file_bytes, "audio/webm")
        )
        return transcript.text