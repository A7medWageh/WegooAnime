'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';

// Stub types (pages fetch directly — these hooks are legacy)
type Anime = any;
type Episode = any;
type Genre = any;
type AnimeFilters = any;
const animeApi = { getAll: async (..._: any[]) => [], getById: async (..._: any[]) => null, getTrending: async () => [], getTopRated: async () => [], getEpisodes: async (..._: any[]) => [], getRelated: async (..._: any[]) => [] };
const episodesApi = { getLatest: async (..._: any[]) => [] };
const genresApi = { getAll: async () => [] };

// Generic async state hook with proper state management
function useAsyncState<T>(asyncFn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Set loading state in a separate microtask
    const controller = new AbortController();

    const fetchData = async () => {
      if (mounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await asyncFn();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, deps);

  const refetch = useCallback(() => {
    setLoading(true);
    asyncFn()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err : new Error('Unknown error')))
      .finally(() => setLoading(false));
  }, [asyncFn]);

  return { data, loading, error, refetch };
}

// Anime list hook
export function useAnimeList(filters?: AnimeFilters, page = 1, limit = 20) {
  return useAsyncState(
    () => animeApi.getAll({ ...filters, page, limit }),
    [JSON.stringify(filters), page, limit]
  );
}

// Single anime hook
export function useAnime(id: string) {
  return useAsyncState(() => animeApi.getById(id), [id]);
}

// Trending anime hook
export function useTrendingAnime() {
  return useAsyncState(() => animeApi.getTrending(), []);
}

// Top rated anime hook
export function useTopRatedAnime() {
  return useAsyncState(() => animeApi.getTopRated(), []);
}

// Episodes hook
export function useEpisodes(animeId: string) {
  return useAsyncState(() => animeApi.getEpisodes(animeId), [animeId]);
}

// Latest episodes hook
export function useLatestEpisodes(limit = 12) {
  return useAsyncState(() => episodesApi.getLatest(limit), [limit]);
}

// Genres hook
export function useGenres() {
  return useAsyncState(() => genresApi.getAll(), []);
}

// Related anime hook
export function useRelatedAnime(animeId: string) {
  return useAsyncState(() => animeApi.getRelated(animeId), [animeId]);
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Infinite scroll hook
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  threshold = 100
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [callback, hasMore, threshold]);

  return loadMoreRef;
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

// Helper function for media query snapshot
function getMediaQuerySnapshot(query: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
}

function subscribeToMediaQuery(callback: () => void, query: string): () => void {
  if (typeof window === 'undefined') return () => { };
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

// Media query hook using useSyncExternalStore
export function useMediaQuery(query: string): boolean {
  const getSnapshot = useCallback(() => getMediaQuerySnapshot(query), [query]);
  const subscribe = useCallback((callback: () => void) => subscribeToMediaQuery(callback, query), [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// Keyboard shortcuts hook
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  deps: unknown[] = []
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey && 'ctrl',
        e.shiftKey && 'shift',
        e.altKey && 'alt',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [JSON.stringify(shortcuts), ...deps]);
}
