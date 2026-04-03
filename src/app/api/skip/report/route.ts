import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { malId, episode, type, startTime, endTime } = body;

        if (!malId || episode === undefined || episode === null || !type || startTime === undefined || endTime === undefined) {
            return NextResponse.json({ error: 'Missing required fields', received: { malId, episode, type, startTime, endTime } }, { status: 400 });
        }

        // Round start time to nearest 5 seconds for bucketing
        const roundedStart = Math.round(Number(startTime) / 5) * 5;
        const roundedEnd = Math.round(Number(endTime) / 5) * 5;

        if (roundedStart >= roundedEnd) {
            return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
        }

        // Convert malId to a consistent string key (supports numeric and string slugs)
        const malIdStr = String(malId).trim();
        const epNum = parseFloat(String(episode));

        if (!malIdStr || isNaN(epNum)) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }


        const updated = await prisma.skipTimeReport.upsert({
            where: {
                skip_report_uid: {
                    malId: malIdStr,
                    episode: epNum,
                    type: type,
                    startTime: roundedStart,
                    endTime: roundedEnd
                }
            },
            update: {
                occurrences: { increment: 1 }
            },
            create: {
                malId: malIdStr,
                episode: epNum,
                type: type,
                startTime: roundedStart,
                endTime: roundedEnd,
                occurrences: 1
            }
        });

        return NextResponse.json({ success: true, report: updated, malIdUsed: malIdStr });
    } catch (e: any) {
        console.error('Skip Report Error:', e);
        return NextResponse.json({ error: 'Failed to report skip time', detail: e.message }, { status: 500 });
    }
}
