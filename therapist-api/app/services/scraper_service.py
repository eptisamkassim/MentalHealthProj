from playwright.async_api import async_playwright
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.therapist import Therapist

class ScraperService:

    async def get_city_therapist(self, city: str, db: Session):
        if city is None:
            raise ValueError("City is required")
        
        # Playwright controls a real browser
        async with async_playwright() as p:
            browser = await p.chromium.launch()  # open Chrome
            page = await browser.new_page()      # open a tab            
            for page_num in range(1, 15):  # 1 to 10
                url = f"https://www.psychologytoday.com/us/therapists?search={city}&page={page_num}"
                await page.goto(url)
                
                links = await page.query_selector_all("a.profile-title")

                hrefs = []
                names = []
                for link in links:
                    href = await link.get_attribute("href")
                    name = await link.inner_text()
                    hrefs.append(href)
                    names.append(name)


                for i, href in enumerate(hrefs):
                    therapist_name = names[i]
                    await page.goto(href)
                    await page.wait_for_load_state("networkidle")  # wait for JS to finish

                    insurance_list = []
                    insurance_items = await page.query_selector_all("div.insurance ul.section-list li")
                    for item in insurance_items:
                        text = await item.inner_text()
                        insurance_list.append(text)

                    accepting_new_clients = None
                    session_type = "not available"

                    appt_element = await page.query_selector("div.at-a-glance_row_appointments div[is-company='false']")
                    if appt_element:
                        appt_text = await appt_element.inner_text()

                        # Parse accepting new clients
                        if "waitlist" in appt_text.lower():
                            accepting_new_clients = False
                        elif "available" in appt_text.lower():
                            accepting_new_clients = True

                        # Parse session type
                        if "in-person and online" in appt_text.lower():
                            session_type = "both"
                        elif "online" in appt_text.lower():
                            session_type = "online"
                        elif "in-person" in appt_text.lower():
                            session_type = "in-person"

                    else:
                        accepting_new_clients = None
                        session_type = "not available"


                    bio_element = await page.query_selector("div.personal-statement-container")
                    if bio_element:
                        bio_text = await bio_element.inner_text()
                    else:
                        bio_text = "No Bio"

                    groups = await page.query_selector_all(".attributes-group")
                    specialty_list = []
                    for group in groups:
                        heading = await group.query_selector("h3.attributes-group-title")
                        heading_text = await heading.inner_text()
                        
                        if "Top Specialties" in heading_text:
                            items = await group.query_selector_all("span.attribute_base")
                            for item in items:
                                text = await item.inner_text()
                                specialty_list.append(text)
                            break  # found what we need, stop looping
                    
                    therapy_type_group = await page.query_selector_all("#treatment-approach-attributes-section span.attribute_base")
                    therapy_type_list = []

                    for item in therapy_type_group:
                        text = await item.inner_text()
                        therapy_type_list.append(text)

                    new_therapist = Therapist(
                        name = therapist_name,
                        bio = bio_text,
                        insurance_list = insurance_list,
                        specialty = specialty_list,
                        accepting_new_clients = accepting_new_clients,
                        session_type = session_type,
                        location = city,
                        therapy_type = therapy_type_list
                    )

                    # Check if therapist already exists by name and location
                    existing = db.query(Therapist).filter(
                        Therapist.name == therapist_name,
                    ).first()

                    if existing:
                        pass  # skip, already in database
                    else:
                        db.add(new_therapist)
                        db.commit()
