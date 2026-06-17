from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.scraper_service import ScraperService

router = APIRouter()

@router.post("/therapist")
async def scrape_therapist(db: Session = Depends(get_db)):
    scraper_service = ScraperService()
    await scraper_service.get_therapist(db)
    return {"message": "Scraping complete"}
