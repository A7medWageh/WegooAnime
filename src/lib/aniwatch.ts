// AniWatch API service — api-anime-rouge.vercel.app
// Mirror: aninescraper.vercel.app
const BASES = [
    'https://api-anime-rouge.vercel.app',
    'https://aninescraper.vercel.app',
];

async function call(path: string): Promise<any> {
    let lastErr: Error | null = null;
    for (const base of BASES) {
        try {
            const res = await fetch(`${base}${path}`, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 3600 },
            });
            if (!res.ok) throw new Error(`${res.status} ${path}`);
            return await res.json();
        } catch (e) {
            lastErr = e as Error;
        }
    }
    throw lastErr;
}

// For episode IDs like "one-piece-100?ep=84802" — do NOT encode the ?ep= part
// The external API literally expects: /aniwatch/servers?id=one-piece-100?ep=84802
function epParam(episodeId: string): string {
    // episodeId may already be decoded (contains literal ?ep=) or encoded (%3Fep%3D)
    const decoded = episodeId.includes('%3F') ? decodeURIComponent(episodeId) : episodeId;
    return decoded; // pass as-is, don't re-encode
}

// ── Types ────────────────────────────────────────────────
export interface AWAnime {
    id: string;
    name: string;
    img: string;
    episodes?: { eps?: number; sub?: number; dub?: number };
    duration?: string;
    rated?: boolean;
    category?: string;
    rank?: number;
}

export interface AWSpotlight extends AWAnime {
    rank: number;
    quality: string;
    releasedDay: string;
    descriptions: string;
}

export interface AWHomeData {
    spotlightAnimes: AWSpotlight[];
    trendingAnimes: AWAnime[];
    latestEpisodes: AWAnime[];
    top10Animes: { day: AWAnime[]; week: AWAnime[]; month: AWAnime[] };
    featuredAnimes: {
        topAiringAnimes: AWAnime[];
        mostPopularAnimes: AWAnime[];
        mostFavoriteAnimes: AWAnime[];
        latestCompletedAnimes: AWAnime[];
    };
    topUpcomingAnimes: AWAnime[];
    genres: string[];
}

export interface AWAnimeInfo {
    info: {
        id: string;
        name: string;
        img: string;
        rating?: string;
        episodes?: { eps?: number; sub?: number; dub?: number };
        category?: string;
        quality?: string;
        duration?: string;
        description?: string;
    };
    moreInfo?: Record<string, any>;
    seasons?: { id: string; name: string; img: string; isCurrent: boolean }[];
    relatedAnimes?: AWAnime[];
    recommendedAnimes?: AWAnime[];
}

export interface AWEpisode {
    name: string;
    episodeNo: number;
    episodeId: string;
    filler: boolean;
}

export interface AWServer {
    serverName: string;
    serverId: number;
}

export interface AWServersData {
    episodeId: string;
    episodeNo: number;
    sub: AWServer[];
    dub: AWServer[];
}

export interface AWStreamSource {
    url: string;
    isM3U8: boolean;
    quality?: string;
}

export interface AWSubtitle {
    lang: string;
    url: string;
}

export interface AWStreamData {
    sources: AWStreamSource[];
    subtitles?: AWSubtitle[];
    headers?: Record<string, string>;
}

// ── API calls ────────────────────────────────────────────
export async function getHome(): Promise<AWHomeData> {
    return call('/aniwatch/');
}

export async function searchAnime(keyword: string, page = 1) {
    return call(`/aniwatch/search?keyword=${encodeURIComponent(keyword)}&page=${page}`);
}

export async function getAnimeInfo(id: string): Promise<AWAnimeInfo> {
    return call(`/aniwatch/anime/${encodeURIComponent(id)}`);
}

export async function getEpisodes(id: string): Promise<{ totalEpisodes: number; episodes: AWEpisode[] }> {
    return call(`/aniwatch/episodes/${encodeURIComponent(id)}`);
}

export async function getServers(episodeId: string): Promise<AWServersData> {
    // ⚠️ Do NOT double-encode — API expects literal ?ep= in URL
    const ep = epParam(episodeId);
    return call(`/aniwatch/servers?id=${ep}`);
}

export async function getStream(
    episodeId: string,
    server = 'vidstreaming',
    category: 'sub' | 'dub' = 'sub'
): Promise<AWStreamData> {
    // ⚠️ Do NOT double-encode — API expects literal ?ep= in query value
    const ep = epParam(episodeId);
    return call(`/aniwatch/episode-srcs?id=${ep}&server=${server}&category=${category}`);
}

export async function getCategory(category: string, page = 1) {
    return call(`/aniwatch/${category}?page=${page}`);
}
