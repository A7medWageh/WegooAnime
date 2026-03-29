// Pixel Arabic Anime API — pixelll.is-a.dev/api
const BASE = 'https://pixelll.is-a.dev/api';

async function call<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Pixel API error: ${res.status} ${path}`);
    return res.json();
}

// ── Types ─────────────────────────────────────────────────
export interface PAnime {
    id: number;
    slug: string;
    title_en: string;
    title_jp?: string;
    cover: string;
    poster: string;
    episodes: number;
    rating: number;
    status: 'FINISHED' | 'RELEASING' | string;
    type: 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | string;
    story?: string;
}

// Episodes: { "1": { "720p": { "AY": "/api/stream/...", "AB": "..." }, "1080p": { ... } }, "2": {...} }
export type PEpisodeQuality = Record<string, string>; // server → path
export type PEpisodeData = Record<string, PEpisodeQuality>; // quality → servers
export type PEpisodes = Record<string, PEpisodeData>; // epNumber → qualities

// ── API calls ─────────────────────────────────────────────
export async function getAnimePage(page = 1): Promise<PAnime[]> {
    const data = await call<PAnime[]>(`/anime?page=${page}`);
    return Array.isArray(data) ? data : [];
}

export async function searchAnime(query: string, page = 1): Promise<PAnime[]> {
    const data = await call<PAnime[]>(`/anime?query=${encodeURIComponent(query)}&page=${page}`);
    return Array.isArray(data) ? data : [];
}

export async function getAnimeBySlug(slug: string): Promise<PAnime | null> {
    const data = await call<PAnime | PAnime[]>(`/anime/${slug}`);
    if (Array.isArray(data)) return data[0] || null;
    return data as PAnime;
}

export async function getEpisodes(slug: string): Promise<PEpisodes> {
    const data = await call<PEpisodes | []>(`/anime/${slug}/episodes`);
    if (Array.isArray(data)) return {};
    return data as PEpisodes;
}

// Build absolute stream URL
export function streamUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `https://pixelll.is-a.dev${path}`;
}
