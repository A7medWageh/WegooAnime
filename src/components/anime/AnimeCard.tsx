'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Play } from 'lucide-react';
import type { Anime } from '@/types/anime';

interface AnimeCardProps {
  anime: Anime;
  index?: number;
  showRating?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimeCard({ anime, index = 0, showRating = true, size = 'md' }: AnimeCardProps) {
  const sizeClasses = {
    sm: 'w-[140px] h-[200px]',
    md: 'w-[180px] h-[260px]',
    lg: 'w-[220px] h-[320px]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`anime-card relative group ${sizeClasses[size]} shrink-0`}
    >
      <Link href={`/anime/${anime.slug}`}>
        {/* Image Container */}
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-white/5">
          {anime.coverImage ? (
            <Image
              src={anime.coverImage}
              alt={anime.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 140px, 180px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30">
              <span className="text-4xl font-bold text-white/20">{anime.title[0]}</span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Rating Badge */}
          {showRating && anime.rating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span>{anime.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Type Badge */}
          {anime.type && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-600/80 backdrop-blur-sm text-xs font-medium">
              {anime.type}
            </div>
          )}

          {/* Hover Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shadow-lg neon-glow"
            >
              <Play className="w-6 h-6 fill-white ml-1" />
            </motion.div>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="font-semibold text-sm line-clamp-2">{anime.title}</h3>
            {anime.year && (
              <p className="text-xs text-gray-400 mt-0.5">{anime.year}</p>
            )}
          </div>
        </div>
      </Link>

      {/* Title Below (visible by default) */}
      <div className="mt-2 px-1 group-hover:opacity-0 transition-opacity">
        <h3 className="font-medium text-sm line-clamp-1">{anime.title}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          {anime.year && (
            <span className="text-xs text-gray-400">{anime.year}</span>
          )}
          {anime._count?.episodes && (
            <span className="text-xs text-gray-500">
              {anime._count.episodes} eps
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
