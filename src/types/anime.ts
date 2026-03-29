// Anime types
export interface Anime {
  id: string;
  malId?: number | null;
  title: string;
  titleEnglish?: string | null;
  titleJapanese?: string | null;
  slug: string;
  synopsis?: string | null;
  description?: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  trailerUrl?: string | null;
  rating: number | null;
  year: number | null;
  season?: string | null;
  status: 'ONGOING' | 'COMPLETED';
  type: 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL';
  studio: string | null;
  source?: string | null;
  totalEpisodes?: number | null;
  duration?: string | null;
  popularity?: number | null;
  rank?: number | null;
  members?: number | null;
  createdAt: Date;
  updatedAt: Date;
  genres?: Genre[];
  episodes?: Episode[];
  _count?: {
    episodes: number;
    favorites: number;
  };
}

export interface Genre {
  id: string;
  malId?: number | null;
  name: string;
  slug: string;
}

export interface Episode {
  id: string;
  malId?: number | null;
  animeId: string;
  number: number;
  title: string;
  thumbnail: string | null;
  videoUrl: string | null;
  duration: number | null;
  airedAt: Date | null;
  createdAt: Date;
  anime?: Anime;
}

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  episodeId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Favorite {
  id: string;
  userId: string;
  animeId: string;
  createdAt: Date;
  anime?: Anime;
}

export interface WatchHistory {
  id: string;
  userId: string;
  episodeId: string;
  progress: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  episode?: Episode & { anime: Anime };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter types
export interface AnimeFilters {
  query?: string;
  genre?: string;
  year?: number;
  status?: string;
  type?: string;
  sortBy?: 'rating' | 'year' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Scraping types
export interface ScrapingLog {
  id: string;
  source: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  itemsScraped: number;
  error: string | null;
  createdAt: Date;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  role: 'USER' | 'ADMIN';
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
