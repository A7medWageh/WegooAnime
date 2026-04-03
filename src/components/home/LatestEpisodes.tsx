'use client';

import { motion } from 'framer-motion';
import { EpisodeCard } from '@/components/anime/EpisodeCard';
import type { Episode, Anime } from '@/types/anime';

interface LatestEpisodesProps {
  episodes: (Episode & { anime?: Anime })[];
}

export function LatestEpisodes({ episodes }: LatestEpisodesProps) {
  if (!episodes.length) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-xl md:text-2xl font-bold">Latest Episodes</h2>
        <a
          href="/search?sortBy=createdAt"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          View All
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4">
        {episodes.map((episode, index) => (
          <EpisodeCard key={episode.id} episode={episode} index={index} />
        ))}
      </div>
    </section>
  );
}
