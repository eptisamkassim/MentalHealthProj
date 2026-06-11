import { NextRequest } from 'next/server'

const API_URL = process.env.API_URL ?? 'http://localhost:8000'

export async function POST(req: NextRequest) {
    const body = await req.text()
    const res = await fetch(`${API_URL}/api/email/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    })
    const data = await res.json()
    return Response.json(data, { status: res.status })
}
