import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const malId = searchParams.get('malId');
    const episode = searchParams.get('episode');

    if (!malId || !episode) {
        return NextResponse.json({ error: 'Missing malId or episode' }, { status: 400 });
    }

    // 0. Primary Internal Database Source (Crowdsourced)
    try {
        const malIdStr = String(malId).trim();
        const epNum = parseFloat(String(episode));
        const malIdHash = malIdStr.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
        
        if (malIdHash && !isNaN(epNum)) {
            const skipReports = await prisma.skipTimeReport.findMany({
                where: {
                    malId: malIdHash,
                    episode: epNum,
                    occurrences: { gte: 2 } // Require 2+ users to confirm
                },
                orderBy: { occurrences: 'desc' }
            });

            if (skipReports.length > 0) {
                const times: any = {};
                const opReport = skipReports.find((r: any) => r.type === 'op');
                const edReport = skipReports.find((r: any) => r.type === 'ed');

                if (opReport) times.op = { start: opReport.startTime, end: opReport.endTime };
                if (edReport) times.ed = { start: edReport.startTime, end: edReport.endTime };

                if (times.op || times.ed) {
                    return NextResponse.json({ source: 'crowdsourced', times });
                }
            }
        }
    } catch (e) {
        console.warn('Database skip times failed:', e);
    }

    // 1. External Source 1: AniSkip
    try {
        const res = await fetch(`https://api.aniskip.com/v2/skip-times/${malId}/${episode}?types=op&types=ed&episodeLength=0`, {
            next: { revalidate: 3600 } // Cache for 1 hour to prevent rate limiting
        });
        if (res.ok) {
            const data = await res.json();
            if (data.found && data.results && data.results.length > 0) {
                const times: any = {};
                data.results.forEach((result: any) => {
                    if (result.skipType === 'op') times.op = { start: result.interval.startTime, end: result.interval.endTime };
                    if (result.skipType === 'ed') times.ed = { start: result.interval.startTime, end: result.interval.endTime };
                });
                if (times.op || times.ed) {
                    return NextResponse.json({ source: 'aniskip', times });
                }
            }
        }
    } catch (e) {
        console.warn('AniSkip failed:', e);
    }

    // 2. Fallback Source: Anime-Skip GraphQL API
    try {
        const query = `
            query ($malId: String!) {
              findShowsByExternalId(service: myanimelist, serviceId: $malId) {
                id
                episodes {
                  number
                  timestamps {
                    at
                    type { name }
                  }
                }
              }
            }
        `;
        const res = await fetch('https://api.anime-skip.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-ID': 'wegooanime-player'
            },
            body: JSON.stringify({
                query,
                variables: { malId: String(malId) }
            }),
            next: { revalidate: 3600 }
        });

        if (res.ok) {
            const data = await res.json();
            const shows = data?.data?.findShowsByExternalId || [];
            if (shows.length > 0) {
                const show = shows[0]; // Take first match
                const ep = show.episodes?.find((e: any) => String(e.number) === String(episode));
                if (ep && ep.timestamps && ep.timestamps.length > 0) {
                    const times: any = {};
                    let ops: number[] = [], ope: number[] = [], eds: number[] = [], ede: number[] = [];
                    
                    // Note: Anime-Skip uses individual point timestamps.
                    ep.timestamps.forEach((t: any) => {
                        const name = t.type?.name?.toLowerCase() || '';
                        if (name.includes('intro') && name.includes('start')) ops.push(t.at);
                        else if (name.includes('intro') && name.includes('end')) ope.push(t.at);
                        else if (name.includes('outro') && name.includes('start')) eds.push(t.at);
                        else if (name.includes('outro') && name.includes('end')) ede.push(t.at);
                    });

                    const opStart = ops.length > 0 ? Math.min(...ops) : null;
                    const opEnd = ope.length > 0 ? Math.max(...ope) : null;
                    const edStart = eds.length > 0 ? Math.min(...eds) : null;
                    const edEnd = ede.length > 0 ? Math.max(...ede) : null;

                    if (opStart !== null && opEnd !== null && opEnd > opStart) times.op = { start: opStart, end: opEnd };
                    if (edStart !== null && edEnd !== null && edEnd > edStart) times.ed = { start: edStart, end: edEnd };
                    
                    // Hard Fallback: if only start exists
                    if (opStart !== null && opEnd === null) times.op = { start: opStart, end: opStart + 85 };
                    if (edStart !== null && edEnd === null) times.ed = { start: edStart, end: edStart + 85 };

                    if (times.op || times.ed) {
                        return NextResponse.json({ source: 'anime-skip', times });
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Anime-Skip GraphQL failed:', e);
    }

    return NextResponse.json({ error: 'No skip times found in any source' }, { status: 404 });
}
