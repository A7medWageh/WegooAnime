import prisma from './prisma';
import { getLatestAnime, getAnimeList, AniAnime, searchAnime } from './anicli';
import { getAiringNow, getAnimeByMalId, JikanAnime, jikanCover, searchJikan } from './jikan';
import { logger } from './logger';

export interface UnifiedAnime {
    id: string;
    mal_id: number | null;
    title: string;
    title_en?: string;
    title_jp?: string;
    slug: string;
    image: string | null;
    synopsis: string | null;
    type: string;
    status: string;
    rating: number | null;
    episodes: number | null;
    genres: string[];
    year: number | null;
    source: 'anicli' | 'jikan' | 'database';
}

const IMG = (url: string | undefined | null) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    let finalUrl = url;
    if (url.startsWith('//')) finalUrl = `https:${url}`;
    if (finalUrl.startsWith('http') === false) return finalUrl;
    return `/api/image-proxy?url=${encodeURIComponent(finalUrl)}`;
};

export class UnifiedAnimeService {
    private static instance: UnifiedAnimeService;
    private static translationCache = new Map<string, string>();
    private static isTranslatingEnabled = true;

    private constructor() {}

    public static getInstance(): UnifiedAnimeService {
        if (!UnifiedAnimeService.instance) {
            UnifiedAnimeService.instance = new UnifiedAnimeService();
        }
        return UnifiedAnimeService.instance;
    }

    private async translateToArabic(text: string): Promise<string> {
        if (!text || !UnifiedAnimeService.isTranslatingEnabled) return text;
        if (/[\u0600-\u06FF]/.test(text)) return text;
        
        const cached = UnifiedAnimeService.translationCache.get(text);
        if (cached) return cached;

        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`);
            if (!res.ok) throw new Error('Translate API failed');
            const data = await res.json();
            const translated = data[0].map((item: any) => item[0]).join('');
            
            if (UnifiedAnimeService.translationCache.size > 1000) {
                const firstKey = UnifiedAnimeService.translationCache.keys().next().value;
                if (firstKey) UnifiedAnimeService.translationCache.delete(firstKey);
            }
            UnifiedAnimeService.translationCache.set(text, translated);
            
            return translated;
        } catch (err) {
            console.error('[Translation] Error:', err);
            return text;
        }
    }

    /**
     * Map AniAnime to UnifiedAnime
     */
    private async mapAni(a: AniAnime, skipTranslation = false): Promise<UnifiedAnime> {
        const rawTitle = a.title_en || a.title;
        return {
            id: a.id,
            mal_id: a.mal_id !== '0' ? parseInt(a.mal_id) : null,
            title: rawTitle,
            title_en: a.title_en,
            title_jp: a.title_jp,
            slug: a.id,
            image: IMG(a.thumbnail),
            synopsis: a.synopsis && a.synopsis.length > 10 ? (skipTranslation ? a.synopsis : await this.translateToArabic(a.synopsis)) : null,
            type: a.type === 'MOVIE' ? 'Movie' : 'TV',
            status: a.status?.toLowerCase().includes('finish') ? 'COMPLETED' : 'ONGOING',
            rating: a.score && a.score !== 'N/A' ? parseFloat(a.score) : null,
            episodes: a.episodes && a.episodes !== 'N/A' ? parseInt(a.episodes) : null,
            genres: a.genres && a.genres !== 'N/A' ? a.genres.split(',').map((g: string) => g.trim()) : [],
            year: a.premiered && a.premiered !== 'N/A' ? parseInt(a.premiered.match(/\d{4}/)?.[0] || '0') : null,
            source: 'anicli'
        };
    }

    /**
     * Map JikanAnime to UnifiedAnime
     */
    private async mapJikan(a: JikanAnime, skipTranslation = false): Promise<UnifiedAnime> {
        const rawTitle = a.title_english || a.title || a.mal_id.toString();
        return {
            id: a.mal_id.toString(),
            mal_id: a.mal_id,
            title: rawTitle,
            title_en: a.title_english,
            title_jp: a.title_japanese,
            slug: a.mal_id.toString(),
            image: IMG(jikanCover(a)),
            synopsis: a.synopsis && a.synopsis.length > 10 ? (skipTranslation ? a.synopsis : await this.translateToArabic(a.synopsis)) : null,
            type: a.type || 'TV',
            status: a.status || 'Ongoing',
            rating: a.score || null,
            episodes: a.episodes || null,
            genres: a.genres?.map((g: any) => g.name) || [],
            year: a.year || null,
            source: 'jikan'
        };
    }

    /**
     * Cache anime to database
     */
    private async cacheAnime(anime: UnifiedAnime) {
        try {
            await prisma.anime.upsert({
                where: { slug: anime.slug },
                update: {
                    title: anime.title,
                    titleEnglish: anime.title_en,
                    titleJapanese: anime.title_jp,
                    synopsis: anime.synopsis,
                    coverImage: anime.image,
                    rating: anime.rating,
                    year: anime.year,
                    totalEpisodes: anime.episodes,
                    malId: anime.mal_id,
                },
                create: {
                    slug: anime.slug,
                    title: anime.title,
                    titleEnglish: anime.title_en,
                    titleJapanese: anime.title_jp,
                    synopsis: anime.synopsis,
                    coverImage: anime.image,
                    rating: anime.rating,
                    year: anime.year,
                    totalEpisodes: anime.episodes,
                    malId: anime.mal_id,
                }
            });
        } catch (err) {
            logger.error('Database', `Failed to cache anime ${anime.slug}`, err);
        }
    }

    /**
     * Get Latest Anime with fallback
     */
    public async getLatest(limit = 40): Promise<UnifiedAnime[]> {
        try {
            const latest = await getLatestAnime(0, limit);
            // Skip translation for large lists to improve speed
            const unified = await Promise.all(latest.map(a => this.mapAni(a, true)));
            
            unified.forEach(a => {
                this.cacheAnime(a).catch(e => logger.error('Database', `Cache jump failed for ${a.slug}`, e));
            });
            
            return unified;
        } catch (err) {
            const dbAnime = await prisma.anime.findMany({
                take: limit,
                orderBy: { updatedAt: 'desc' }
            });

            if (dbAnime.length > 0) {
                return dbAnime.map(a => ({
                    id: a.slug, mal_id: a.malId, title: a.title,
                    title_en: a.titleEnglish || undefined,
                    title_jp: a.titleJapanese || undefined,
                    slug: a.slug, image: a.coverImage || null,
                    synopsis: a.synopsis,
                    type: String(a.type), status: String(a.status),
                    rating: a.rating, episodes: a.totalEpisodes,
                    genres: [], year: a.year, source: 'database'
                }));
            }

            try {
                const airing = await getAiringNow();
                return Promise.all(airing.slice(0, limit).map(a => this.mapJikan(a, true)));
            } catch {
                return [];
            }
        }
    }

    public async getTopRated(limit = 20): Promise<UnifiedAnime[]> {
        try {
            const top = await getAnimeList('SORT', 'HIGHEST_RATE', 'SERIES', 0, limit);
            const unified = await Promise.all(top.map(a => this.mapAni(a, true)));
            unified.forEach(a => {
                this.cacheAnime(a).catch(e => console.error(`[UnifiedService] TopRated Cache failed for ${a.slug}:`, e));
            });
            return unified;
        } catch (err) {
            const dbAnime = await prisma.anime.findMany({
                take: limit,
                orderBy: { rating: 'desc' }
            });

            return dbAnime.map(a => ({
                id: a.slug, mal_id: a.malId, title: a.title,
                title_en: a.titleEnglish || undefined,
                title_jp: a.titleJapanese || undefined, slug: a.slug, image: a.coverImage || null,
                synopsis: a.synopsis, type: String(a.type), status: String(a.status),
                rating: a.rating, episodes: a.totalEpisodes, genres: [], year: a.year, source: 'database'
            }));
        }
    }

    public async getAiring(limit = 15): Promise<UnifiedAnime[]> {
        try {
            const airing = await getAiringNow();
            if (!airing || airing.length === 0) throw new Error('Jikan returned empty');
            
            const unified = await Promise.all(airing.slice(0, limit).map(a => this.mapJikan(a, false)));
            unified.forEach(a => {
                this.cacheAnime(a).catch(e => console.error(`[UnifiedService] Airing Cache failed for ${a.slug}:`, e));
            });
            return unified;
        } catch (err) {
            console.warn('[UnifiedService] getAiring source (Jikan) failing, falling back to DB/Scraper');
            
            // 1. Try DB Fallback (Ongoing status)
            const dbAnime = await prisma.anime.findMany({
                where: { status: 'ONGOING' },
                take: limit,
                orderBy: { updatedAt: 'desc' }
            });
            
            if (dbAnime.length > 0) {
                return dbAnime.map(a => ({
                    id: a.slug, mal_id: a.malId, title: a.title,
                    title_en: a.titleEnglish || undefined,
                    title_jp: a.titleJapanese || undefined, slug: a.slug, image: a.coverImage || null,
                    synopsis: a.synopsis, type: String(a.type), status: String(a.status),
                    rating: a.rating, episodes: a.totalEpisodes, genres: [], year: a.year, source: 'database'
                }));
            }

            // 2. Critical Fallback: Try Scraper (anicli) latest list to fill the void
            try {
                const latest = await getLatestAnime(0, limit);
                return Promise.all(latest.map(a => this.mapAni(a, true)));
            } catch {
                return [];
            }
        }
    }
    public async getFeaturedAnimes(): Promise<UnifiedAnime[]> {
        const featuredNames = [
            "Sousou no Frieren 2nd Season",
            "Frieren: Beyond Journey's End Season 2",
            "Jujutsu Kaisen: The Culling Game Part 1",
            "Hell's Paradise Season 2",
            "Sentenced to Be a Hero",
            "[Oshi No Ko] Season 3",
            "Steel Ball Run: JoJo's Bizarre Adventure",
            "Fire Force Season 3 Part 2",
            "Fate/strange Fake",
            "You and I Are Polar Opposites",
            "Jack-of-All-Trades, Party of None", // Removed arabic hint text for better search
            "Chained Soldier Season 2",
            "Shiboyugi: Playing Death Games to Put Food on the Table"
        ];

        try {
            // First check database for these specific animes to save API calls
            let dbAnimes: any[] = [];
            try {
                dbAnimes = await prisma.anime.findMany({
                    where: { OR: featuredNames.map(f => ({ title: { contains: f.substring(0, 5) } })) }
                });
            } catch (dbErr) {
                // Silently ignore if DB is not configured (e.g. no DATABASE_URL)
            }

            const results = await Promise.all(featuredNames.map(async (name) => {
                try {
                    // Try finding exact match in DB first
                    const dbMatch = dbAnimes.find(a => a.title.toLowerCase().includes(name.toLowerCase().substring(0, 5)));
                    if (dbMatch) {
                        return {
                            id: dbMatch.slug, mal_id: dbMatch.malId, title: dbMatch.title,
                            title_en: dbMatch.titleEnglish || undefined,
                            title_jp: dbMatch.titleJapanese || undefined, slug: dbMatch.slug, image: dbMatch.coverImage || null,
                            synopsis: dbMatch.synopsis, type: String(dbMatch.type), status: String(dbMatch.status),
                            rating: dbMatch.rating, episodes: dbMatch.totalEpisodes, genres: [], year: dbMatch.year, source: 'database'
                        } as UnifiedAnime;
                    }

                    // 1. Search via Arabic API (anicli) for best streaming compatibility
                    const query = name.replace(/Season \d+|Part \d+/gi, '').trim(); // Remove season numbers to broaden search
                    const searchResults = await searchAnime(query);
                    if (searchResults && searchResults.length > 0) {
                        const hit = searchResults[0];
                        // If description is missing, too short, or just a lazy sequel placeholder, fetch authentic story from Jikan base season
                        const isBadSynopsis = !hit.synopsis || hit.synopsis.length < 30 || 
                            (hit.synopsis.length < 200 && /season|sequel|موسم|تكملة|جزء/i.test(hit.synopsis));
                            
                        if (isBadSynopsis) {
                            try {
                                const baseQuery = name.replace(/Season \d+|Part \d+|2nd Season|3rd Season|Movie|The Movie/gi, '').replace(/[\[\]]/g, '').trim();
                                const j = await searchJikan(baseQuery);
                                // Find most detailed synopsis from the first 5 Jikan results
                                const bestResult = j?.slice(0, 5).reduce((prev, current) => 
                                    (prev.synopsis && current.synopsis && prev.synopsis.length > current.synopsis.length) ? prev : current
                                );
                                
                                if (bestResult && bestResult.synopsis && bestResult.synopsis.length > 50) {
                                    hit.synopsis = bestResult.synopsis;
                                }
                            } catch(e) {}
                        }
                        return await this.mapAni(hit, false);
                    }

                    // 2. Fallback to Jikan (MAL) if missing from Arabic API completely
                    const jikanResults = await searchJikan(name);
                    if (jikanResults && jikanResults.length > 0) {
                        return await this.mapJikan(jikanResults[0], false);
                    }
                    
                    return null;
                } catch {
                    return null;
                }
            }));

            const validResults = results.filter((r): r is UnifiedAnime => r !== null);
            validResults.forEach(a => {
                this.cacheAnime(a).catch(() => {});
            });
            return validResults;
        } catch (err) {
            console.error('[UnifiedService] Failed to fetch featured animes', err);
            return [];
        }
    }
}

export const animeService = UnifiedAnimeService.getInstance();
