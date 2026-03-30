import { NextRequest, NextResponse } from 'next/server';
export const revalidate = 3600; // Cache for 1 hour to prevent scraping externally every load
export const dynamic = 'force-dynamic'; // Required when using NextRequest but we want revalidate to work under dynamic conditions or cache where possible
import { animeService } from '@/lib/UnifiedAnimeService';
import {
  getLatestAnime, getAnimeList, searchAnime as aniSearch,
  getEpisodes, getServers, extractMediafire, cleanBrandText,
} from '@/lib/anicli';
import { getAnimeByMalId, searchJikan, jikanBanner, jikanCover, getAiringNow, getJikanEpisodeVideos } from '@/lib/jikan';
import prisma from '@/lib/prisma';

const IMG = (url: string | undefined | null) =>
  url ? `/api/image-proxy?url=${encodeURIComponent(url)}` : null;

// Simple global in-memory cache for production-like speed in dev
const _cache: any = {
  translations: new Map(),
  anime: new Map(),
  episodes: new Map(),
};
const CACHE_TTL = 3600 * 1000; // 1 hour

const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Built-in simple free Google Translate API fetcher
async function translateToArabic(text: string): Promise<string> {
  if (!text) return '';
  const cached = _cache.translations.get(text);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.value;

  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    const result = data[0].map((item: any) => item[0]).join('');
    _cache.translations.set(text, { value: result, time: Date.now() });
    return result;
  } catch (err) {
    console.error('Translation error:', err);
    return text;
  }
}

async function toCard(a: any) {
  let thumb = a.thumbnail;

  // Auto-fetch missing image from Jikan API
  if (!thumb || thumb.includes('/404.jpg') || thumb.trim() === '') {
    if (a.mal_id && a.mal_id !== '0') {
      const jikan = await getAnimeByMalId(String(a.mal_id)).catch(() => null);
      if (jikan?.images?.jpg?.large_image_url) {
        thumb = jikan.images.jpg.large_image_url;
      }
    }
    
    // Fallback to name search if MAL ID fails
    if ((!thumb || thumb.includes('/404.jpg') || thumb.trim() === '') && a.title_en) {
      const jResults = await searchJikan(a.title_en).catch(() => []);
      if (jResults[0]?.images?.jpg?.large_image_url) {
        thumb = jResults[0].images.jpg.large_image_url;
      }
    }
  }

  return {
    id: a.id, title: a.title_en || a.title_jp || a.id, title_jp: a.title_jp || null,
    slug: a.id, image: IMG(thumb) || '', synopsis: a.synopsis ? cleanBrandText(a.synopsis) : '',
    type: a.type === 'MOVIE' ? 'Movie' : 'TV',
    status: a.status?.toLowerCase().includes('finish') ? 'COMPLETED' : 'ONGOING',
    rating: a.score && a.score !== 'N/A' ? parseFloat(a.score) : null,
    episodes: a.episodes && a.episodes !== 'N/A' ? parseInt(a.episodes) : null,
    genres: a.genres && a.genres !== 'N/A' ? a.genres.split(',').map((g: string) => g.trim()) : [],
    year: a.premiered && a.premiered !== 'N/A' ? a.premiered : null,
    creators: a.creators || null, animeType: a.type || 'SERIES', mal_id: a.mal_id || null,
  };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const action = sp.get('action') || 'home';

  try {
    if (action === 'home') {
      const [latest, topRated, airingNow] = await Promise.all([
        animeService.getLatest(40),
        animeService.getTopRated(20),
        animeService.getAiring(15)
      ]);

      return NextResponse.json({
        success: true,
        latest,
        topRated,
        trending: latest.slice(0, 15),
        airingNow
      });
    }

    // ── SEARCH ───────────────────────────────────────────
    if (action === 'search') {
      const q = sp.get('q');
      const limit = parseInt(sp.get('limit') || '40');
      if (q) {
        // Simple normalization for better Arabic & English matching
        const norm = (s: string) => s ? s.toLowerCase().trim()
          .replace(/[أإآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/[ةه]/g, 'ه')
          .replace(/[\u064B-\u0652]/g, '') // remove Tashkeel
          .replace(/[^a-z0-9\u0600-\u06FF]/gi, ' ')
          .replace(/\s+/g, ' ').trim() : '';

        const normalizedQuery = norm(q);

        // 1. Local Database Search
        // We fetch more than limit to allow ranking and filtering in JS
        const localResults = await prisma.anime.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { titleEnglish: { contains: q, mode: 'insensitive' } },
              { titleJapanese: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              // Match against the space-normalized query as well
              { title: { contains: normalizedQuery, mode: 'insensitive' } },
              { titleEnglish: { contains: normalizedQuery, mode: 'insensitive' } }
            ]
          },
          take: 100 
        });

        const mappedLocal = localResults.map(a => {
          const tNorm = norm(a.title);
          const eNorm = norm(a.titleEnglish || '');
          const sNorm = norm(a.slug);
          
          let score = 0;
          // Exact matches get highest score
          if (tNorm === normalizedQuery || eNorm === normalizedQuery || sNorm === normalizedQuery) score = 100;
          // Starts with gets high score
          else if (tNorm.startsWith(normalizedQuery) || eNorm.startsWith(normalizedQuery)) score = 80;
          // Contains gets normal score
          else if (tNorm.includes(normalizedQuery) || eNorm.includes(normalizedQuery)) score = 50;
          else score = 10;

          return {
            id: a.slug,
            title: a.title,
            slug: a.slug,
            image: a.coverImage ? (a.coverImage.startsWith('http') ? IMG(a.coverImage) : a.coverImage) : PLACEHOLDER_IMG,
            type: a.type,
            rating: a.rating || 'N/A',
            score
          };
        });

        // 2. External Search (for discovery - if local results are few or low quality)
        let externalResults: any[] = [];
        if (mappedLocal.filter(l => l.score > 40).length < 3) {
           const results = await aniSearch(q).catch(() => []);
           externalResults = await Promise.all(results.slice(0, 10).map(toCard));
        }

        // 3. Merge & Ranking
        const combined = [...mappedLocal];
        externalResults.forEach(ext => {
           if (!combined.some(loc => loc.id === ext.id)) {
             // External results default to a decent score
             combined.push({ ...ext, score: 30 });
           }
        });

        // Final sort by relevance score
        const finalResults = combined
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(({ score, ...rest }) => rest);

        return NextResponse.json({ success: true, data: finalResults });
      }

      const genre = sp.get('genre');
      if (genre) {
        // Fetch 5 pages to get ~150-200 anime
        const pagesRaw = await Promise.allSettled([
          getAnimeList('GENRE', genre || '', 'SERIES', 0, 40),
          getAnimeList('GENRE', genre || '', 'SERIES', 40, 40),
          getAnimeList('GENRE', genre || '', 'SERIES', 80, 40),
          getAnimeList('GENRE', genre || '', 'SERIES', 120, 40),
          getAnimeList('GENRE', genre || '', 'SERIES', 160, 40),
        ]);
        const results = pagesRaw
          .filter((p): p is PromiseFulfilledResult<any[]> => p.status === 'fulfilled')
          .map(p => p.value)
          .flat();
        
        if (results.length === 0) {
           const errors = pagesRaw.filter(p => p.status === 'rejected');
           if (errors.length > 0) console.warn("⚠️ [API/search] Genre fetch failed completely:", errors[0]);
        }

        return NextResponse.json({ success: true, data: await Promise.all(results.map(toCard)) });
      }
      return NextResponse.json({ success: false, error: 'Query or genre required' }, { status: 400 });
    }

    // ── LIST ─────────────────────────────────────────────
    if (action === 'list') {
      const type = sp.get('type') || 'SERIES';
      const sort = sp.get('sort') || 'HIGHEST_RATE';

      let list: any[] = [];
      if (sort === 'LATEST') {
        const pagesRaw = await Promise.allSettled([
          getLatestAnime(0, 40),
          getLatestAnime(40, 40),
          getLatestAnime(80, 40),
          getLatestAnime(120, 40),
          getLatestAnime(160, 40),
        ]);
        list = pagesRaw
          .filter((p): p is PromiseFulfilledResult<any[]> => p.status === 'fulfilled')
          .map(p => p.value)
          .flat();
      } else {
        const pagesRaw = await Promise.allSettled([
          getAnimeList('SORT', sort, type, 0, 40),
          getAnimeList('SORT', sort, type, 40, 40),
          getAnimeList('SORT', sort, type, 80, 40),
          getAnimeList('SORT', sort, type, 120, 40),
          getAnimeList('SORT', sort, type, 160, 40),
        ]);
        list = pagesRaw
          .filter((p): p is PromiseFulfilledResult<any[]> => p.status === 'fulfilled')
          .map(p => p.value)
          .flat();
      }

      return NextResponse.json({ success: true, data: await Promise.all(list.map(toCard)) });
    }

    // ── ANIME DETAILS (enriched with Jikan) ──────────────
    if (action === 'anime') {
      let slug = sp.get('slug');
      if (!slug) return NextResponse.json({ success: false, error: 'Slug required' }, { status: 400 });

      const cached = _cache.anime.get(slug);
      if (cached && Date.now() - cached.time < CACHE_TTL) return NextResponse.json({ success: true, data: cached.value });

      let jikan: any = null;
      let originalSlug = slug;

      // Map Jikan ID to Anicli Slug if necessary
      if (!isNaN(Number(slug))) {
        jikan = await getAnimeByMalId(slug).catch(() => null);
        if (jikan) {
          let searchTitles = [
            jikan.title_english,
            jikan.title,
            jikan.title_english?.replace(/[^\w\s]/gi, ' '),
            jikan.title?.replace(/[^\w\s]/gi, ' ')
          ].filter(Boolean) as string[];

          let searchRes: any[] = [];
          for (const title of searchTitles) {
            searchRes = await aniSearch(title).catch(() => []);
            if (searchRes.length > 0) break;
          }

          // Use the best match id if found
          if (searchRes.length > 0) {
            slug = searchRes[0].id; // Assign the mapped AniCli slug!
          }
        }
      }

      const searchSlug = slug || originalSlug;
      // Convert "xJujutsuKaisenS3" into "Jujutsu Kaisen S 3" to allow Search API to find metadata!
      const formattedSearchQuery = searchSlug.replace(/[-_]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
        .replace(/(\d+)([a-zA-Z])/g, '$1 $2')
        .replace(/^x\s*/i, '').trim() || searchSlug;

      const [results, episodes] = await Promise.all([
        getAnimeList('SEARCH', formattedSearchQuery, 'SERIES', 0, 5).catch(() => []),
        getEpisodes(searchSlug).catch(() => []), // Must use exact slug for episodes
      ]);

      let aniData = results.find((a: any) => a.id === searchSlug || a.title_en?.toLowerCase().includes(formattedSearchQuery.toLowerCase())) || results[0];
      if (!aniData) {
        const mv = await getAnimeList('SEARCH', formattedSearchQuery, 'MOVIE', 0, 3).catch(() => []);
        aniData = mv.find((a: any) => a.id === searchSlug || a.title_en?.toLowerCase().includes(formattedSearchQuery.toLowerCase())) || mv[0];
      }

      // Enrich with Jikan
      if (!jikan && aniData?.mal_id && aniData.mal_id !== '0') {
        jikan = await getAnimeByMalId(String(aniData.mal_id)).catch(() => null);
      }
      if (!jikan) {
        const q = aniData?.title_en || aniData?.title_jp || formattedSearchQuery;
        const jResults = await searchJikan(q).catch(() => []);
        jikan = jResults[0] || null;
      }

      const banner = jikan ? jikanBanner(jikan) : null;
      let cover = aniData?.thumbnail;
      if ((!cover || cover.includes('/404.jpg') || cover.trim() === '') && jikan) {
        cover = jikan.images?.jpg?.large_image_url || jikan.images?.webp?.large_image_url || jikanCover(jikan);
      }

      let jikanEps: any[] = [];
      if (jikan?.mal_id) {
        jikanEps = await getJikanEpisodeVideos(jikan.mal_id).catch(() => []);
      }

      const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const resultData = {
          id: slug, slug,
          title: jikan?.title || jikan?.title_english || aniData?.title_en || formattedSearchQuery,
          title_jp: jikan?.title_japanese || aniData?.title_jp || null,
          image: cover ? (cover.includes('jikan') || cover.includes('myanimelist') ? cover : (IMG(cover) || PLACEHOLDER_IMG)) : PLACEHOLDER_IMG,
          banner: banner ? (banner.includes('jikan') || banner.includes('myanimelist') ? banner : (IMG(banner) || PLACEHOLDER_IMG)) : PLACEHOLDER_IMG,
          synopsis: await translateToArabic(jikan?.synopsis || ''),
          type: jikan?.type || (aniData?.type === 'MOVIE' ? 'Movie' : 'TV'),
          status: jikan?.status || (aniData?.status?.toLowerCase().includes('finish') ? 'Finished Airing' : 'Currently Airing'),
          rating: jikan?.score || (aniData?.score !== 'N/A' ? parseFloat(aniData?.score) : null),
          episodes: jikan?.episodes || aniData?.episodes || null,
          year: jikan?.year || null, season: jikan?.season || null,
          duration: jikan?.duration || null, rated: jikan?.rating || null,
          genres: jikan?.genres?.map((g: any) => g.name) || (aniData?.genres !== 'N/A' ? aniData?.genres?.split(',').map((g: string) => g.trim()) : []),
          studios: jikan?.studios?.map((s: any) => s.name) || [aniData?.creators].filter(Boolean),
          mal_id: aniData?.mal_id || jikan?.mal_id || null,
          trailer: jikan?.trailer?.url || null,
          animeType: aniData?.type || 'SERIES',
          episodeList: episodes.map(ep => {
            const jEp = jikanEps.find(j => String(j.episode) === String(ep.displayNum));
            return {
              id: `${slug}--${ep.number}`,
              number: ep.displayNum,
              title: `${ep.type} ${ep.displayNum}`,
              slug: `${slug}--${ep.number}`,
              isFiller: false,
              image: jEp?.images?.jpg?.image_url ? IMG(jEp.images.jpg.image_url) : undefined,
            };
          }),
      };

      _cache.anime.set(slug, { value: resultData, time: Date.now() });
      return NextResponse.json({ success: true, data: resultData });
    }

    // ── EPISODE ──────────────────────────────────────────
    if (action === 'episode') {
      const idParam = sp.get('id');
      if (!idParam) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

      const cached = _cache.episodes.get(idParam);
      if (cached && Date.now() - cached.time < CACHE_TTL) return NextResponse.json({ success: true, data: cached.value });

      let animeId = '';
      let epNum = '1';
      let finalId = idParam;

      if (!idParam.includes('--')) {
        // It's an Anime Slug or MAL ID, NOT an episode ID. We must find its first episode.
        let slug = idParam;
        if (!isNaN(Number(slug))) {
          const jikan = await getAnimeByMalId(slug).catch(() => null);
          if (jikan) {
            let searchTitles = [
              jikan.title_english,
              jikan.title,
              jikan.title_english?.replace(/[^\w\s]/gi, ' '),
              jikan.title?.replace(/[^\w\s]/gi, ' ')
            ].filter(Boolean) as string[];

            let searchRes: any[] = [];
            for (const title of searchTitles) {
              searchRes = await aniSearch(title).catch(() => []);
              if (searchRes.length > 0) {
                slug = searchRes[0].id; // Assign mapped AniCli slug!
                break;
              }
            }
          }
        }
        animeId = slug || '';

        // Fetch episodes to find the first one
        const episodes = await getEpisodes(animeId).catch(() => []);
        if (episodes.length > 0) {
          epNum = episodes[episodes.length - 1].number.toString(); // API returns episodes in reverse order usually? Wait, let's just use '1' or the last one's number. Actually getEpisodes returns episodes. Let's find the one with the smallest number.
          const firstEp = episodes.reduce((prev: any, curr: any) => parseFloat(prev.number) < parseFloat(curr.number) ? prev : curr, episodes[0]);
          epNum = firstEp ? firstEp.number.toString() : '1';
        }
        finalId = `${animeId}--${epNum}`; // reconstruct for the response
      } else {
        const parts = idParam.split('--');
        animeId = parts.slice(0, -1).join('--');
        epNum = parts[parts.length - 1];
      }

      const formattedSearchQuery = animeId.replace(/[-_]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
        .replace(/(\d+)([a-zA-Z])/g, '$1 $2')
        .replace(/^x\s*/i, '').trim() || animeId;

      const [results, episodes] = await Promise.all([
        getAnimeList('SEARCH', formattedSearchQuery, 'SERIES', 0, 3).catch(() => []),
        getEpisodes(animeId).catch(() => []),
      ]);
      let anime = results.find((a: any) => a.id === animeId || a.title_en?.toLowerCase().includes(formattedSearchQuery.toLowerCase())) || results[0];
      if (!anime) {
        const mv = await getAnimeList('SEARCH', formattedSearchQuery, 'MOVIE', 0, 3).catch(() => []);
        anime = mv.find((a: any) => a.id === animeId || a.title_en?.toLowerCase().includes(formattedSearchQuery.toLowerCase())) || mv[0];
      }
      const serverData = await getServers(animeId, String(epNum), anime?.type || 'SERIES').catch(() => null);
      const currentEp = serverData?.CurrentEpisode || {};
      const QUALITIES = [
        { key: 'FRFhdQ', quality: '1080p' },
        { key: 'FRLink', quality: '720p' },
        { key: 'FRLowQ', quality: '480p' },
      ];
      let availableSources = QUALITIES.filter(q => currentEp[q.key]).map(q => ({ quality: q.quality, serverId: currentEp[q.key] }));

      // Fallback: If no standard qualities found (common for new/external servers), grab whatever is valid
      if (availableSources.length === 0 && currentEp && typeof currentEp === 'object') {
        const excludeKeys = ['Episode', 'Type', 'Status'];
        for (const [key, value] of Object.entries(currentEp)) {
          if (typeof value === 'string' && value.length > 5 && !excludeKeys.includes(key)) {
            let q = 'HD';
            if (key.match(/1080|fhd/i)) q = '1080p';
            else if (key.match(/720|link/i)) q = '720p';
            else if (key.match(/480|low/i)) q = '480p';

            // Clean the server name from witanime
            const cleanKey = cleanBrandText(key);
            availableSources.push({ quality: `${q} (${cleanKey})`, serverId: value });
          }
        }
      }
      const currentEpObj = episodes.find(e => e.number === epNum);

      // Use the fast native AniCli thumbnail instead of blocking the player with a slow Jikan request
      let fastImg = anime?.thumbnail;

      // Enrich with Jikan if anicli is missing a thumbnail or has a broken link
      if (!fastImg || fastImg.includes('/404.jpg') || fastImg.trim() === '') {
        const q = anime?.title_en || anime?.title_jp || formattedSearchQuery;
        const jikanRes = await searchJikan(q).catch(() => []);
        if (jikanRes.length > 0) {
          fastImg = jikanRes[0].images?.jpg?.large_image_url || jikanRes[0].images?.webp?.large_image_url || jikanCover(jikanRes[0]);
        }
      }

      const resultData = {
          id: finalId || '', number: currentEpObj?.displayNum || parseFloat(epNum) || 1,
          title: currentEpObj ? `${currentEpObj.type} ${currentEpObj.displayNum}` : `الحلقة ${epNum}`,
          anime: { 
            id: animeId, 
            title: anime?.title_en || anime?.title_jp || formattedSearchQuery, 
            slug: animeId, 
            image: fastImg ? (fastImg.includes('jikan') || fastImg.includes('myanimelist') ? fastImg : IMG(fastImg)) : PLACEHOLDER_IMG,
            mal_id: anime?.mal_id || null
          },
          episodes: episodes.map(ep => ({ id: `${animeId}--${ep.number}`, number: ep.displayNum, title: `${ep.type} ${ep.displayNum}` })),
          availableSources, hasDirectLinks: availableSources.length > 0,
      };

      _cache.episodes.set(idParam, { value: resultData, time: Date.now() });
      return NextResponse.json({ success: true, data: resultData });
    }

    // ── STREAM ───────────────────────────────────────────
    if (action === 'stream') {
      const serverId = sp.get('id');
      if (!serverId) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
      const url = await extractMediafire(serverId);
      if (!url) return NextResponse.json({ success: false, error: 'Could not extract stream URL' }, { status: 404 });
      return NextResponse.json({ success: true, url });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[/api/anime]', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
