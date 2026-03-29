// Anime Nexus API Service
export const IMAGE_BASE = 'https://assets.anime.nexus';

export interface SeasonalAnime {
  id: string;
  title: string;
  posterImage: string;
  rating?: number;
  genres?: string[];
  year?: number;
  episodes?: number;
  status?: string;
  synopsis?: string;
  type?: string;
  slug?: string;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  duration?: number;
  image?: string;
  isFiller?: boolean;
  isRecap?: boolean;
}

export interface AnimeDetails {
  id: string;
  title: string;
  posterImage?: string;
  bannerImage?: string;
  synopsis?: string;
  rating?: number;
  genres?: string[];
  year?: number;
  status?: string;
  type?: string;
  episodes: Episode[];
  totalEpisodes?: number;
}

export interface StreamData {
  videoId: string;
  sources: { url: string; quality: string }[];
  subtitles?: { url: string; lang: string }[];
  thumbnails?: string;
}

export interface Comment {
  id: string;
  user: string;
  content: string;
  createdAt: string;
  likes: number;
}

// API helper
async function fetchAPI(action: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const response = await fetch(`/api/streaming?${query}`);
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  return response.json();
}

// Get seasonal anime list
export async function getSeasonalAnime(): Promise<{ anime: SeasonalAnime[]; imageBase: string }> {
  const result = await fetchAPI('seasonal');
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch seasonal anime');
  }
  
  // Handle response structure
  let animeList: any[] = [];
  const data = result.data;
  
  if (Array.isArray(data)) {
    animeList = data;
  } else if (data?.data && Array.isArray(data.data)) {
    animeList = data.data;
  } else if (data?.anime) {
    animeList = data.anime;
  }
  
  return {
    anime: animeList.map(transformAnime),
    imageBase: result.imageBase || IMAGE_BASE,
  };
}

// Get anime details with episodes
export async function getAnimeDetails(id: string, page: number = 1): Promise<AnimeDetails> {
  const result = await fetchAPI('details', { id, page: page.toString() });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch anime details');
  }
  
  const data = result.data;
  
  // Handle different response structures
  let episodeList: any[] = [];
  let animeInfo: any = {};
  
  if (data?.data && Array.isArray(data.data)) {
    episodeList = data.data;
    animeInfo = data;
  } else if (data?.episodes && Array.isArray(data.episodes)) {
    episodeList = data.episodes;
    animeInfo = data;
  }
  
  return {
    id: animeInfo.id || id,
    title: animeInfo.name || animeInfo.title || 'Unknown',
    posterImage: extractImagePath(animeInfo.poster),
    bannerImage: extractImagePath(animeInfo.banner),
    synopsis: animeInfo.description || animeInfo.synopsis,
    rating: animeInfo.rating || animeInfo.score,
    genres: animeInfo.genres?.map((g: any) => typeof g === 'string' ? g : g.name) || [],
    year: animeInfo.release_date ? new Date(animeInfo.release_date).getFullYear() : animeInfo.year,
    status: animeInfo.status,
    type: animeInfo.type,
    episodes: episodeList.map(transformEpisode),
    totalEpisodes: animeInfo.episodes_count || episodeList.length,
  };
}

// Get episode stream data
export async function getEpisodeStream(episodeId: string): Promise<StreamData> {
  const result = await fetchAPI('stream', { id: episodeId });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch stream data');
  }
  
  const data = result.data;
  
  return {
    videoId: data.videoId || data.video_id || data.id,
    sources: data.sources || [],
    subtitles: data.subtitles || [],
    thumbnails: data.thumbnails,
  };
}

// Get video stream URL (m3u8)
export async function getVideoStream(videoId: string): Promise<string> {
  // Return the proxy URL for m3u8
  return `/api/streaming?action=video&videoId=${videoId}`;
}

// Get episode comments
export async function getComments(episodeId: string, page: number = 1): Promise<Comment[]> {
  const result = await fetchAPI('comments', { id: episodeId, page: page.toString() });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch comments');
  }
  
  return result.data?.comments || result.data || [];
}

// Search anime
export async function searchAnime(query: string): Promise<{ anime: SeasonalAnime[]; imageBase: string }> {
  const result = await fetchAPI('search', { q: query });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to search anime');
  }
  
  let animeList: any[] = [];
  const data = result.data;
  
  if (Array.isArray(data)) {
    animeList = data;
  } else if (data?.data && Array.isArray(data.data)) {
    animeList = data.data;
  } else if (data?.anime) {
    animeList = data.anime;
  }
  
  return {
    anime: animeList.map(transformAnime),
    imageBase: result.imageBase || IMAGE_BASE,
  };
}

// Helper functions
function extractImagePath(poster: any): string {
  if (!poster) return '';
  
  if (typeof poster === 'string') return poster;
  
  if (poster.resized) {
    return poster.resized['480x720'] || poster.resized['640x960'] || 
           poster.resized['1560x2340'] || Object.values(poster.resized)[0] || '';
  }
  
  if (poster.path) return poster.path;
  
  return '';
}

function transformAnime(raw: any): SeasonalAnime {
  return {
    id: raw.id,
    title: raw.name || raw.title || 'Unknown',
    posterImage: extractImagePath(raw.poster),
    rating: raw.rating || raw.score,
    genres: raw.genres?.map((g: any) => typeof g === 'string' ? g : g.name) || [],
    year: raw.release_date ? new Date(raw.release_date).getFullYear() : raw.year,
    episodes: raw.episodes_count || raw.episodes,
    status: raw.status,
    synopsis: raw.description || raw.synopsis,
    type: raw.type,
    slug: raw.slug,
  };
}

function transformEpisode(raw: any): Episode {
  return {
    id: raw.id,
    number: raw.number || raw.episode_number || 1,
    title: raw.title || raw.name || `الحلقة ${raw.number || 1}`,
    duration: raw.duration,
    image: extractImagePath(raw.image || raw.thumbnail),
    isFiller: raw.is_filler || raw.isFiller,
    isRecap: raw.is_recap || raw.isRecap,
  };
}
