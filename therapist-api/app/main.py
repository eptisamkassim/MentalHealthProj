import logging
import os
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
from sqlalchemy import text
from app.database import engine


load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

redis_client = redis.from_url(os.getenv("REDIS_URL"), decode_responses=True) if os.getenv("REDIS_URL") else None

app = FastAPI(
    title="Therapist Matcher API",
    description="AI-powered therapist matching service",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

@app.middleware("http")
async def rate_limit(request, call_next):
    if redis_client is None:
        return await call_next(request)

    ip = request.client.host
    key = f"rate:{ip}"

    try:
        count = redis_client.incr(key)
        if count == 1:
            redis_client.expire(key, 3600)

        if count > 100:
            logger.warning(f"Rate limit exceeded for IP {ip}")
            return Response("Rate limit exceeded", status_code=429)
    except redis.exceptions.ConnectionError:
        logger.warning("Redis unavailable, skipping rate limiting")

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting Therapist Matcher API (env={settings.ENVIRONMENT})")
    logger.info(f"Allowed origins: {settings.ALLOWED_ORIGINS}")
    if redis_client:
        try:
            redis_client.ping()
            logger.info("Redis connection OK")
        except Exception as e:
            logger.warning(f"Redis unavailable at startup: {e}")
    else:
        logger.warning("REDIS_URL not set — rate limiting disabled")


@app.get("/health")
async def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        db_status = "unreachable"

    return {"status": "ok", "environment": settings.ENVIRONMENT, "db": db_status}

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(scraper_router, prefix="/api/scrape", tags=["scrape"])
app.include_router(therapists_router, prefix="/api/therapists", tags=["therapists"])
app.include_router(email_router, prefix="/api/email", tags=["email"])
app.include_router(outreach_router, prefix="/api/outreach", tags=["outreach"])
app.include_router(voice_router, prefix="/api/voice", tags=["voice"])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
