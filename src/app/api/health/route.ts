import { NextResponse } from 'next/server';
import { getLatestAnime } from '@/lib/anicli';
import { getAiringNow } from '@/lib/jikan';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const status: any = {
        timestamp: new Date().toISOString(),
        services: {
            anicli: { status: 'unknown' },
            jikan: { status: 'unknown' },
            database: { status: 'unknown' }
        },
        overall: 'healthy'
    };

    // Check AniCli
    try {
        await getLatestAnime(0, 1);
        status.services.anicli = { status: 'healthy' };
    } catch (err: any) {
        status.services.anicli = { status: 'unhealthy', error: err.message };
        status.overall = 'degraded';
    }

    // Check Jikan
    try {
        await getAiringNow();
        status.services.jikan = { status: 'healthy' };
    } catch (err: any) {
        status.services.jikan = { status: 'unhealthy', error: err.message };
        status.overall = status.overall === 'healthy' ? 'degraded' : 'unhealthy';
    }

    // Check Database
    try {
        await prisma.anime.count();
        status.services.database = { status: 'healthy' };
    } catch (err: any) {
        status.services.database = { status: 'unhealthy', error: err.message };
        status.overall = 'unhealthy';
    }

    const httpStatus = status.overall === 'healthy' ? 200 : (status.overall === 'degraded' ? 200 : 500);

    return NextResponse.json(status, { status: httpStatus });
}
