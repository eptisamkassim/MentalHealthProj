import os
import sys
from dotenv import load_dotenv

load_dotenv()
REQUIRED_VARS = ["DATABASE_URL", "OPENAI_API_KEY"]

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    ALLOWED_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()
    ]

    def validate(self):
        missing = [v for v in REQUIRED_VARS if not os.getenv(v)]
        if missing:
            print(f"FATAL: Missing required environment variables: {', '.join(missing)}", file=sys.stderr)
            sys.exit(1)

settings = Settings()
settings.validate()
