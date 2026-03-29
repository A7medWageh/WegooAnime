'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Play } from 'lucide-react';
import type { Episode, Anime } from '@/types/anime';

interface EpisodeCardProps {
  episode: Episode & { anime?: Anime };
  index?: number;
  showAnime?: boolean;
}

export function EpisodeCard({ episode, index = 0, showAnime = true }: EpisodeCardProps) {
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    return `${minutes} min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="anime-card relative group"
    >
      <Link href={`/watch/${episode.id}`}>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5">
          {episode.thumbnail ? (
            <Image
              src={episode.thumbnail}
              alt={episode.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30">
              <Play className="w-12 h-12 text-white/20" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Episode Number Badge */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600/80 backdrop-blur-sm text-xs font-medium">
            EP {episode.number}
          </div>

          {/* Duration Badge */}
          {episode.duration && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-xs">
              <Clock className="w-3 h-3" />
              {formatDuration(episode.duration)}
            </div>
          )}

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg neon-glow"
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </motion.div>
          </div>
        </div>
      </Link>

      <div className="mt-2 px-1">
        <h4 className="font-medium text-sm line-clamp-1">{episode.title}</h4>
        {showAnime && episode.anime && (
          <Link
            href={`/anime/${episode.anime.slug}`}
            className="text-xs text-gray-400 hover:text-purple-400 transition-colors line-clamp-1"
          >
            {episode.anime.title}
          </Link>
        )}
      </div>
    </motion.div>
  );
}
