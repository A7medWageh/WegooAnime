import { NextResponse } from 'next/server';

// Stub — scraper service no longer used
export async function GET() {
    return NextResponse.json({ success: false, message: 'Scraper service removed. Use /api/anime instead.' }, { status: 410 });
}
