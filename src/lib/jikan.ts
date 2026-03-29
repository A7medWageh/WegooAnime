// Jikan API (jikan.moe) — free MyAnimeList wrapper, no auth needed
const BASE = 'https://api.jikan.moe/v4';

export interface JikanAnime {
    mal_id: number;
    title: string;
    title_english?: string;
    title_japanese?: string;
    synopsis?: string;
    type?: string;
    status?: string;
    score?: number;
    rank?: number;
    popularity?: number;
    episodes?: number;
    year?: number;
    season?: string;
    rating?: string;
    duration?: string;
    images: { jpg: { image_url: string; large_image_url?: string }; webp?: { image_url: string; large_image_url?: string } };
    trailer?: { url?: string; embed_url?: string; images?: { medium_image_url?: string; large_image_url?: string } };
    genres?: { mal_id: number; name: string }[];
    studios?: { mal_id: number; name: string }[];
    producers?: { mal_id: number; name: string }[];
    aired?: { from?: string; string?: string };
    background?: string;
}

async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        next: { revalidate: 86400 }, // cache 24h
        headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Jikan ${res.status}: ${path}`);
    const json = await res.json();
    return json.data as T;
}

export async function getAnimeByMalId(malId: string | number): Promise<JikanAnime | null> {
    try {
        return await get<JikanAnime>(`/anime/${malId}`);
    } catch { return null; }
}

export async function getJikanEpisodeVideos(malId: string | number): Promise<any[]> {
    try {
        const res = await fetch(`${BASE}/anime/${malId}/videos/episodes`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch { return []; }
}

export async function searchJikan(query: string): Promise<JikanAnime[]> {
    try {
        const res = await fetch(`${BASE}/anime?q=${encodeURIComponent(query)}&limit=5&sfw=false`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch { return []; }
}

export async function getAiringNow(): Promise<JikanAnime[]> {
    try {
        const res = await fetch(`${BASE}/seasons/now?limit=15&sfw=false`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch { return []; }
}

export function jikanBanner(anime: JikanAnime): string | null {
    // Use trailer image as banner if available, otherwise large image
    return anime.trailer?.images?.large_image_url
        || anime.trailer?.images?.medium_image_url
        || anime.images?.jpg?.large_image_url
        || anime.images?.jpg?.image_url
        || null;
}

export function jikanCover(anime: JikanAnime): string {
    return anime.images?.webp?.large_image_url
        || anime.images?.jpg?.large_image_url
        || anime.images?.jpg?.image_url
        || '';
}
