'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WatchHistoryEntry {
    animeId: string;       // AniCli or Jikan ID
    episodeId: string;     // The unique episode slug/link
    episodeNumber: string; // E.g. "5"
    timestamp: number;     // Date.now() when last watched
    watchedSeconds?: number; // How far into the episode they are
}

interface HistoryContextType {
    history: Record<string, WatchHistoryEntry>; // Indexed by animeId
    updateHistory: (animeId: string, episodeId: string, episodeNumber: string, watchedSeconds?: number) => void;
    getHistory: (animeId: string) => WatchHistoryEntry | undefined;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
    const [history, setHistory] = useState<Record<string, WatchHistoryEntry>>({});
    const [mounted, setMounted] = useState(false);

    // Initialize from localStorage
    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem('wego_anime_history');
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load watch history", error);
        }
    }, []);

    // Save whenever history updates (after initial mount)
    useEffect(() => {
        if (mounted) {
            try {
                localStorage.setItem('wego_anime_history', JSON.stringify(history));
            } catch (error) {
                console.error("Failed to save watch history", error);
            }
        }
    }, [history, mounted]);

    const updateHistory = React.useCallback((animeId: string, episodeId: string, episodeNumber: string, watchedSeconds?: number) => {
        setHistory((prev) => {
            const existing = prev[animeId];
            return {
                ...prev,
                [animeId]: {
                    ...existing,
                    animeId,
                    episodeId,
                    episodeNumber,
                    timestamp: Date.now(),
                    ...(watchedSeconds !== undefined && { watchedSeconds })
                }
            };
        });
    }, []);

    const getHistory = React.useCallback((animeId: string) => {
        return history[animeId];
    }, [history]);

    const contextValue = React.useMemo(() => ({ 
        history, updateHistory, getHistory 
    }), [history, updateHistory, getHistory]);

    return (
        <HistoryContext.Provider value={contextValue}>
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistory() {
    const context = useContext(HistoryContext);
    if (context === undefined) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
}
