# AI Therapist Matching Agent

A web app that matches users with compatible therapists using AI, currently focused on the Greater Boston area. Users can speak or type their needs, the app extracts preferences, and returns ranked therapist matches with auto-generated outreach emails.

## Demo

> Voice or text intake → Therapist matches → One-click email drafts

**Try it live: [mental-health-proj.vercel.app](https://mental-health-proj.vercel.app/)**

---

## The Problem

Mental health care in the US has a massive access gap, and finding the right therapist is a major barrier.

| Stat | Source |
|---|---|
| 23.4% of adults in the U.S. experienced any mental illness (AMI) in the past year, equivalent to over 60 million people | [Mental Health America, 2025](https://mhanational.org/wp-content/uploads/2025/09/State-of-Mental-Health-2025.pdf) |
| 1 in 4 (25%) adults with AMI reported an unmet need for mental health treatment in the past year | [Mental Health America, 2025](https://mhanational.org/wp-content/uploads/2025/09/State-of-Mental-Health-2025.pdf) |

**This app addresses these barriers directly, starting with the Greater Boston area:**
- Removes the overwhelming provider search process with AI-guided matching
- Filters by insurance upfront so users only see accessible options
- Auto-generates outreach emails so users don't have to cold-call offices
- Voice-first design lowers friction for users in distress

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + pgvector |
| AI | OpenAI GPT (conversation + email generation) |
| Voice | OpenAI Whisper (speech-to-text) |
| Matching | OpenAI Embeddings + pgvector semantic search |
| Scraping | Playwright + BeautifulSoup4 |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Features

- **Voice or text intake**: speak or type your needs, whichever you prefer
- **AI conversation**: OpenAI GPT asks follow-up questions to extract your preferences
- **Semantic matching**: pgvector finds therapists by specialty, insurance, and bio similarity
- **Email generation**: OpenAI drafts a personalized outreach email for each therapist
- **Outreach tracking**: log and view emails sent to therapists

---

## Project Structure

```
MentalHealthProj/
├── therapist-matcher/        # Next.js frontend
│   ├── app/api/              # chat, therapists, voice, email, outreach routes
│   └── components/           # VoiceInterface, TherapistCard, ErrorBoundary
└── therapist-api/            # FastAPI backend
    ├── app/
    │   ├── routes/           # chat, therapists, email, voice, outreach, scraper
    │   └── services/         # gpt, matching, scraper
    └── tests/
```

---

## Local Development

For contributors who want to run the project locally.

### Prerequisites

- Node.js 18+, Python 3.10+, Docker, OpenAI API key

### Frontend

```bash
cd therapist-matcher
npm install
# Add your env vars to .env.local
npm run dev
```

### Backend

```bash
cd therapist-api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Add your env vars to .env
uvicorn app.main:app --reload
```

### Database

```bash
docker-compose up -d
python create_tables.py
python generate_embeddings.py
```

---

## Environment Variables

### Frontend (`therapist-matcher/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`therapist-api/.env`)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/therapist_db
OPENAI_API_KEY=sk-...
```

---

## Performance (Validated Benchmarks)

| Metric | Result |
|---|---|
| OpenAI multi-turn chat response time | ~800ms avg |
| Therapist matching with AI explanations | ~2.8s avg |
| Endpoint reliability | 100% across 20 automated test runs |

---

## Deployment

- **Frontend**: Deploy `therapist-matcher` to [Vercel](https://vercel.com)
- **Backend**: Deploy `therapist-api` to [Railway](https://railway.app)
- **Database**: PostgreSQL with pgvector extension enabled
