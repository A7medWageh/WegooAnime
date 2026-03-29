'use client';

import { useFavorites, FavoriteAnime } from '@/context/FavoritesContext';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

export function FavoriteButton({ anime, className = "" }: { anime: FavoriteAnime, className?: string }) {
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const [isFav, setIsFav] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsFav(isFavorite(anime.slug));
    }, [isFavorite, anime.slug]);

    if (!mounted) return null; // Prevent SSR hydration mismatch on the heart icon

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFav) {
            removeFavorite(anime.slug);
            setIsFav(false);
        } else {
            addFavorite(anime);
            setIsFav(true);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center justify-center transition-all ${isFav ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-white hover:scale-110'} ${className}`}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
            <Heart className={`w-full h-full transition-all ${isFav ? 'fill-red-500 stroke-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'stroke-current'}`} />
        </button>
    );
}
