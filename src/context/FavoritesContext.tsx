'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FavoriteAnime {
    id: string;
    slug: string;
    title: string;
    image: string;
    type?: string;
    rating?: number | null;
}

interface FavoritesContextType {
    favorites: FavoriteAnime[];
    addFavorite: (anime: FavoriteAnime) => void;
    removeFavorite: (slug: string) => void;
    isFavorite: (slug: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteAnime[]>([]);
    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem('wego_anime_favorites');
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load favorites", error);
        }
    }, []);

    // Save to localStorage whenever favorites change, but only after initial mount
    useEffect(() => {
        if (mounted) {
            try {
                localStorage.setItem('wego_anime_favorites', JSON.stringify(favorites));
            } catch (error) {
                console.error("Failed to save favorites", error);
            }
        }
    }, [favorites, mounted]);

    const addFavorite = React.useCallback((anime: FavoriteAnime) => {
        setFavorites((prev) => {
            if (prev.some(f => f.slug === anime.slug)) return prev;
            return [...prev, anime];
        });
    }, []);

    const removeFavorite = React.useCallback((slug: string) => {
        setFavorites((prev) => prev.filter(f => f.slug !== slug));
    }, []);

    const isFavorite = React.useCallback((slug: string) => {
        return favorites.some(f => f.slug === slug);
    }, [favorites]);

    const contextValue = React.useMemo(() => ({
        favorites, addFavorite, removeFavorite, isFavorite
    }), [favorites, addFavorite, removeFavorite, isFavorite]);

    return (
        <FavoritesContext.Provider value={contextValue}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
