from app.services.gpt_service import GPTService
from fastapi import APIRouter, UploadFile, File

router = APIRouter()
gpt_service = GPTService()

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    file_bytes = await file.read()
    transcript = gpt_service.transcribe(file_bytes)
    return { "transcript": transcript }
