// ani-cli-arabic API service
// Fetches credentials dynamically from Cloudflare Worker, then calls private PHP API

const CREDS_URL = 'https://api.ani-cli-arabic.dev/credentials';
const DEFAULT_CREDS_AUTH = '6rK9z0XyW8vQ3J7pL2mN4sB1tH5gD0fA';
const CREDS_AUTH = process.env.ANI_CLI_AUTH || DEFAULT_CREDS_AUTH;

interface Credentials {
    ANI_CLI_AR_API_BASE: string;
    ANI_CLI_AR_TOKEN: string;
    THUMBNAILS_BASE_URL: string;
    TRAILERS_BASE_URL?: string;
}

let _creds: Credentials | null = null;
let _credsExpiry = 0;

async function getCreds(): Promise<Credentials> {
    if (_creds && Date.now() < _credsExpiry) return _creds;
    try {
        const res = await fetch(CREDS_URL, {
            headers: { 'X-Auth-Key': CREDS_AUTH, 'User-Agent': 'AniCliAr/2.0' },
            next: { revalidate: 3600 },
        });

        if (res.status === 401) {
            console.error('❌ [AniCli] Unauthorized: Invalid or expired CREDS_AUTH key.');
            throw new Error('API Credentials Invalid (Unauthorized)');
        }

        if (!res.ok) {
            console.error(`❌ [AniCli] Credentials fetch failed with status: ${res.status}`);
            throw new Error(`Credentials fetch failed: ${res.status}`);
        }

        _creds = await res.json() as Credentials;
        
        if (!_creds || !_creds.ANI_CLI_AR_API_BASE) {
            console.error('❌ [AniCli] Received invalid credentials format from worker');
            throw new Error('Invalid credentials format');
        }

        _credsExpiry = Date.now() + 3600_000; // 1 hour cache
        return _creds;
    } catch (err: any) {
        console.error('❌ [AniCli] Error in getCreds:', err.message);
        throw err;
    }
}

async function postApi(endpoint: string, body: Record<string, string>): Promise<any> {
    try {
        const creds = await getCreds();
        const base = creds.ANI_CLI_AR_API_BASE;
        const token = creds.ANI_CLI_AR_TOKEN;
        const thumbBase = creds.THUMBNAILS_BASE_URL;

        const form = new URLSearchParams({ ...body, Token: token });
        const res = await fetch(base + endpoint, {
            method: 'POST',
            body: form,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!res.ok) {
            console.error(`❌ [AniCli] API error on ${endpoint}: ${res.status}`);
            throw new Error(`API error: ${res.status} ${endpoint}`);
        }

        const data = await res.json();
        return { data, thumbBase };
    } catch (err: any) {
        // Log error but rethrow to be caught by higher level resilience
        console.warn(`⚠️ [AniCli] postApi failed for ${endpoint}:`, err.message);
        throw err;
    }
}

// ── Types ──────────────────────────────────────────────
export interface AniAnime {
    id: string;
    title_en: string;
    title_jp: string;
    type: string;  // SERIES | MOVIE
    episodes: string;
    status: string;
    genres: string;
    mal_id: string;
    score: string;
    rank: string;
    popularity: string;
    rating: string;
    premiered: string;
    creators: string;
    duration: string;
    thumbnail: string;
    trailer: string;
    synopsis?: string;
}

export interface AniEpisode {
    number: string; // e.g. "1", "1.5"
    type: string;   // "Episode" | "OVA" | etc.
    displayNum: number;
}

export interface AniServers {
    CurrentEpisode: {
        FRFhdQ?: string;  // 1080p MediaFire ID
        FRLink?: string;  // 720p MediaFire ID
        FRLowQ?: string;  // 480p MediaFire ID
        [key: string]: any;
    };
    [key: string]: any;
}

// ── Utility Functions ────────────────────────────────────
export function cleanBrandText(text: string): string {
    if (!text) return text;
    // Remove "witanime.com", "witanime .com", "witanime", "ويتانمي", "ويت انمي", "ويت انمى"
    return text.replace(/witanime\s*\.?\s*com|witanime|ويتانمي|ويت\s*انمي|ويت\s*انمى/gi, 'WegoAnime').trim();
}

// ── API functions ──────────────────────────────────────
function parseAnime(item: any, thumbBase: string): AniAnime {
    const thumb = item.Thumbnail ? thumbBase + item.Thumbnail : '';
    return {
        id: item.AnimeId || '',
        title_en: cleanBrandText(item.EN_Title || 'Unknown'),
        title_jp: cleanBrandText(item.JP_Title || ''),
        type: item.Type || 'SERIES',
        episodes: String(item.Episodes || 'N/A'),
        status: item.Status || 'N/A',
        genres: item.Genres || 'N/A',
        mal_id: String(item.MalId || '0'),
        score: String(item.Score || 'N/A'),
        rank: String(item.Rank || 'N/A'),
        popularity: String(item.Popularity || 'N/A'),
        rating: item.Rating || 'N/A',
        premiered: item.Season || 'N/A',
        creators: item.Creators || 'N/A',
        duration: String(item.Duration || 'N/A'),
        thumbnail: thumb,
        trailer: item.Trailer || '',
        synopsis: cleanBrandText(item.Synopsis || ''),
    };
}

export async function getAnimeList(
    filterType = '',
    filterData = '',
    animeType = 'SERIES',
    from = 0,
    limit = 40,
): Promise<AniAnime[]> {
    const { data, thumbBase } = await postApi('anime/load_anime_list_v2.php', {
        UserId: '0',
        Language: 'ar',
        FilterType: filterType,
        FilterData: filterData,
        Type: animeType,
        From: String(from),
    });
    if (!Array.isArray(data)) return [];
    return data.slice(0, limit).map((item: any) => parseAnime(item, thumbBase));
}

export async function getLatestAnime(from = 0, limit = 40): Promise<AniAnime[]> {
    const { data, thumbBase } = await postApi('anime/load_latest_anime.php', {
        UserId: '0',
        Language: 'ar',
        From: String(from),
    });
    if (!Array.isArray(data)) return [];
    return data.slice(0, limit).map((item: any) => parseAnime(item, thumbBase));
}

export async function searchAnime(query: string): Promise<AniAnime[]> {
    const [series, movies] = await Promise.all([
        getAnimeList('SEARCH', query, 'SERIES', 0, 20).catch(() => []),
        getAnimeList('SEARCH', query, 'MOVIE', 0, 10).catch(() => []),
    ]);
    return [...series, ...movies];
}

export async function getEpisodes(animeId: string): Promise<AniEpisode[]> {
    const { data } = await postApi('episodes/load_episodes.php', {
        AnimeID: animeId,
    });
    if (!Array.isArray(data)) return [];

    // Deduplicate logic: Map by episode number to remove API duplicates
    const epMap = new Map<string, AniEpisode>();

    data.forEach((ep: any, idx: number) => {
        const num = ep.Episode || String(idx + 1);
        let displayNum: number;
        try {
            displayNum = num.includes('.') ? parseFloat(num) : parseInt(num);
        } catch {
            displayNum = idx + 1;
        }

        // Only keep the first (or last) encountered unique episode number
        if (!epMap.has(num)) {
            let epType = ep.Type ? cleanBrandText(ep.Type) : 'Episode';
            // Also, if the type contains WegoAnime but it should just be "الحلقة", we can normalize it entirely or leave it as WegoAnime.
            // But usually we just leave it unless we want to do more replacement.
            epMap.set(num, { number: String(num), type: epType, displayNum });
        }
    });

    return Array.from(epMap.values());
}

export async function getServers(animeId: string, episodeNum: string, animeType = 'SERIES'): Promise<AniServers | null> {
    const { data } = await postApi('anime/load_servers.php', {
        UserId: '0',
        AnimeId: animeId,
        Episode: String(episodeNum),
        AnimeType: animeType,
    });
    return data || null;
}

// Extract direct MP4 from MediaFire page
export async function extractMediafire(serverId: string): Promise<string | null> {
    if (!serverId) return null;

    // Return direct stream links instead of trying to scrape them
    if (serverId.startsWith('http') && !serverId.includes('mediafire.com')) {
        return serverId;
    }

    const url = serverId.startsWith('http')
        ? serverId
        : `https://www.mediafire.com/file/${serverId}`;
    try {
        // Add timeout for faster failure
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const res = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const html = await res.text();

        // 1. Precise Match: Download Button ID (fastest)
        let match = html.match(/id="downloadButton"\s+href="([^"]+)"/i);
        if (match) return match[1];

        // 2. Fallback Match: Mediafire download subdomain
        match = html.match(/href="(https?:\/\/download\d*[^"]+mediafire\.com[^"]+)"/i);
        if (match) return match[1];

        // 3. Keep old fallback: Anything containing .mp4
        match = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/i);
        if (match) return match[1];

        // 4. Desperate fallback
        match = html.match(/(https:\/\/download[^"'\s]+)/);
        return match ? match[1] : null;
    } catch (err) {
        console.error('Mediafire extraction failed:', err);
        return null;
    }
}

export function getThumbnailBase(): Promise<string> {
    return getCreds().then(c => c.THUMBNAILS_BASE_URL);
}
