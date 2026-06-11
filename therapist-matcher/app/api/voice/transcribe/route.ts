import { NextRequest } from 'next/server'

const API_URL = process.env.API_URL ?? 'http://localhost:8000'

export async function POST(req: NextRequest) {
    const formData = await req.formData()
    const res = await fetch(`${API_URL}/api/voice/transcribe`, {
        method: 'POST',
        body: formData,
    })
    const data = await res.json()
    return Response.json(data, { status: res.status })
}
