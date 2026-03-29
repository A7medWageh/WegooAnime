'use client';

import { motion } from 'framer-motion';

export function AnimeCardSkeleton() {
  return (
    <div className="w-[180px] shrink-0">
      <div className="w-full h-[260px] rounded-lg skeleton" />
      <div className="mt-2 space-y-2">
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  );
}

export function EpisodeCardSkeleton() {
  return (
    <div className="w-full">
      <div className="w-full aspect-video rounded-lg skeleton" />
      <div className="mt-2 space-y-2">
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[80vh] min-h-[500px] max-h-[800px] w-full">
      <div className="absolute inset-0 skeleton" />
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          <div className="h-8 w-24 rounded-full skeleton" />
          <div className="h-16 w-3/4 rounded skeleton" />
          <div className="flex gap-4">
            <div className="h-4 w-16 rounded skeleton" />
            <div className="h-4 w-20 rounded skeleton" />
            <div className="h-4 w-16 rounded skeleton" />
          </div>
          <div className="h-24 w-full rounded skeleton" />
          <div className="flex gap-4">
            <div className="h-12 w-36 rounded skeleton" />
            <div className="h-12 w-36 rounded skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnimeDetailSkeleton() {
  return (
    <div className="py-8">
      {/* Banner */}
      <div className="w-full h-[400px] rounded-xl skeleton mb-8" />
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="w-[200px] h-[300px] rounded-lg skeleton shrink-0" />
          
          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="h-10 w-3/4 rounded skeleton" />
            <div className="flex gap-4">
              <div className="h-6 w-20 rounded skeleton" />
              <div className="h-6 w-20 rounded skeleton" />
              <div className="h-6 w-20 rounded skeleton" />
            </div>
            <div className="h-24 w-full rounded skeleton" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-16 rounded-full skeleton" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Episodes */}
        <div className="mt-12 space-y-4">
          <div className="h-8 w-40 rounded skeleton" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <EpisodeCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CarouselSkeleton() {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="h-8 w-48 rounded skeleton" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full skeleton" />
          <div className="h-8 w-8 rounded-full skeleton" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
