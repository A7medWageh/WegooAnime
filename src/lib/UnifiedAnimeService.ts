import prisma from './prisma';
import { getLatestAnime, getAnimeList, AniAnime } from './anicli';
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
        const rawTitle = (a as any).AR_Title || a.title_en || a.title_jp || a.id;
        return {
            id: a.id,
            mal_id: a.mal_id !== '0' ? parseInt(a.mal_id) : null,
            title: rawTitle,
            title_en: a.title_en,
            title_jp: a.title_jp,
            slug: a.id,
            image: IMG(a.thumbnail),
            synopsis: a.synopsis ? (skipTranslation ? a.synopsis : await this.translateToArabic(a.synopsis)) : null,
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
            synopsis: a.synopsis ? (skipTranslation ? a.synopsis : await this.translateToArabic(a.synopsis)) : null,
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
}

export const animeService = UnifiedAnimeService.getInstance();
