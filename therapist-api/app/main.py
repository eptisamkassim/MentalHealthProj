from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.config import settings
from app.routes.chat import router as chat_router
from app.routes.scraper import router as scraper_router
from app.routes.therapists import router as therapists_router
from app.routes.email import router as email_router
from app.routes.outreach import router as outreach_router
from app.routes.voice import router as voice_router
import redis
import uvicorn
import os


load_dotenv()
redis_client = redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)


app = FastAPI(
    title="Therapist Matcher API",
    description="AI-powered therapist matching service",
    version="1.0.0"
)

@app.middleware("http")
async def rate_limit(request, call_next):
    ip = request.client.host
    key = f"rate:{ip}"

    try:
        count = redis_client.incr(key)
        if count == 1:
            redis_client.expire(key, 3600)  # 1 hour

        if count > 100:
            return Response("Rate limit exceeded", status_code=429)
    except redis.exceptions.ConnectionError:
        pass  # Redis unavailable, skip rate limiting

    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(scraper_router, prefix="/api/scrape", tags=["scrape"])
app.include_router(therapists_router, prefix="/api/therapists", tags=["therapists"])
app.include_router(email_router, prefix="/api/email", tags=["email"])
app.include_router(outreach_router, prefix="/api/outreach", tags=["outreach"])
app.include_router(voice_router, prefix="/api/voice", tags=["voice"])


if __name__ == "__main__":
    uvicorn.run(app, port=8000, log_level="info")
