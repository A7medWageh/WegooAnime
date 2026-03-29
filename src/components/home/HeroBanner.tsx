'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Anime } from '@/types/anime';

interface HeroBannerProps {
  animes: Anime[];
}

export function HeroBanner({ animes }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredAnime = animes[currentIndex];

  // Auto-rotate featured anime
  useEffect(() => {
    if (animes.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animes.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [animes.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % animes.length);
  };

  if (!featuredAnime) return null;

  return (
    <section className="relative h-[80vh] min-h-[500px] max-h-[800px] w-full overflow-hidden">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={featuredAnime.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {featuredAnime.bannerImage ? (
            <Image
              src={featuredAnime.bannerImage}
              alt={featuredAnime.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : featuredAnime.coverImage ? (
            <Image
              src={featuredAnime.coverImage}
              alt={featuredAnime.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={featuredAnime.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              {/* Type Badge */}
              {featuredAnime.type && (
                <span className="inline-block px-3 py-1 rounded-full bg-purple-600/80 text-sm font-medium mb-4">
                  {featuredAnime.type}
                </span>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {featuredAnime.title}
              </h1>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
                {featuredAnime.rating && (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    {featuredAnime.rating.toFixed(1)}
                  </span>
                )}
                {featuredAnime.year && <span>{featuredAnime.year}</span>}
                {featuredAnime.status && (
                  <span className={featuredAnime.status === 'ONGOING' ? 'text-green-400' : 'text-gray-400'}>
                    {featuredAnime.status}
                  </span>
                )}
                {featuredAnime._count?.episodes && (
                  <span>{featuredAnime._count.episodes} Episodes</span>
                )}
              </div>

              {/* Genres */}
              {featuredAnime.genres && featuredAnime.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {featuredAnime.genres.slice(0, 4).map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2 py-0.5 rounded bg-white/10 text-xs"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {featuredAnime.description && (
                <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-3">
                  {featuredAnime.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Link href={`/anime/${featuredAnime.slug}`}>
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 gap-2 neon-glow">
                    <Play className="w-5 h-5 fill-white" />
                    Watch Now
                  </Button>
                </Link>
                <Link href={`/anime/${featuredAnime.slug}`}>
                  <Button size="lg" variant="outline" className="gap-2 border-white/20 hover:bg-white/10">
                    <Info className="w-5 h-5" />
                    More Info
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      {animes.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {animes.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {animes.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-purple-500'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
