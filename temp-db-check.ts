import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB Diagnostic Start ---');
    try {
        const animeCount = await prisma.anime.count();
        console.log('Total Anime in DB:', animeCount);

        const ongoingCount = await prisma.anime.count({
            where: { status: 'ONGOING' }
        });
        console.log('Ongoing Anime count:', ongoingCount);

        const completedCount = await prisma.anime.count({
            where: { status: 'COMPLETED' }
        });
        console.log('Completed Anime count:', completedCount);

        const latestAnime = await prisma.anime.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' }
        });
        console.log('Latest 5 Anime Slugs:', latestAnime.map(a => a.slug));

    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
