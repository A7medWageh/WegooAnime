import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, AnimeFilters } from '@/types/anime';

// Auth Store
interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

// UI Store
interface UIStore {
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  isPlayerMinimized: boolean;
  currentTheme: 'dark' | 'light';
  toggleSidebar: () => void;
  toggleSearch: () => void;
  setPlayerMinimized: (minimized: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: false,
  isSearchOpen: false,
  isPlayerMinimized: false,
  currentTheme: 'dark',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setPlayerMinimized: (isPlayerMinimized) => set({ isPlayerMinimized }),
  setTheme: (currentTheme) => set({ currentTheme }),
}));

// Filter Store
interface FilterStore {
  filters: AnimeFilters;
  setFilters: (filters: Partial<AnimeFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: AnimeFilters = {
  query: '',
  genre: undefined,
  year: undefined,
  status: undefined,
  type: undefined,
  sortBy: 'rating',
  sortOrder: 'desc',
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

// Player Store
interface PlayerStore {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playbackRate: number;
  quality: string;
  isFullscreen: boolean;
  showControls: boolean;
  autoNext: boolean;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackRate: (rate: number) => void;
  setQuality: (quality: string) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setShowControls: (show: boolean) => void;
  toggleAutoNext: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  isPlaying: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  quality: 'auto',
  isFullscreen: false,
  showControls: true,
  autoNext: true,
  setPlaying: (isPlaying) => set({ isPlaying }),
  setMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setQuality: (quality) => set({ quality }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setShowControls: (showControls) => set({ showControls }),
  toggleAutoNext: () => set((state) => ({ autoNext: !state.autoNext })),
}));
