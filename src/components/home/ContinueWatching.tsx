'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Clock } from 'lucide-react';
import type { WatchHistory } from '@/types/anime';

interface ContinueWatchingProps {
  history: (WatchHistory & {
    episode: {
      id: string;
      number: number;
      title: string;
      thumbnail: string | null;
      duration: number | null;
      anime: {
        id: string;
        title: string;
        slug: string;
      };
    };
  })[];
}

export function ContinueWatching({ history }: ContinueWatchingProps) {
  if (!history.length) return null;

  const formatProgress = (seconds: number, total: number = 1440) => {
    const percent = Math.min(100, (seconds / total) * 100);
    return Math.round(percent);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-xl md:text-2xl font-bold">Continue Watching</h2>
        <Link
          href="/profile?tab=history"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4">
        {history.map((item, index) => {
          const progress = formatProgress(item.progress, (item.episode.duration || 24) * 60);
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/watch/${item.episode.id}`} className="group block">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5">
                  {item.episode.thumbnail ? (
                    <Image
                      src={item.episode.thumbnail}
                      alt={item.episode.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30">
                      <Play className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Episode badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600/80 text-xs font-medium">
                    EP {item.episode.number}
                  </div>

                  {/* Duration */}
                  {item.episode.duration && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-xs">
                      <Clock className="w-3 h-3" />
                      {item.episode.duration} min
                    </div>
                  )}

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shadow-lg neon-glow">
                      <Play className="w-6 h-6 fill-white ml-1" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-medium line-clamp-1">{item.episode.anime.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400 line-clamp-1">{item.episode.title}</p>
                    <span className="text-xs text-purple-400 shrink-0 ml-2">{progress}%</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
