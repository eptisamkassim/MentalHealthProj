from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.scraper_service import ScraperService

router = APIRouter()

@router.post("/therapist")
async def scrape_therapists(db: Session = Depends(get_db)):
    scrapper_service = ScraperService()
    response = await scrapper_service.get_city_therapist("Boston", db)
    return {"message": "Scraping complete"}
