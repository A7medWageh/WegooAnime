"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, Star, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

// Mock trending anime data
const trendingAnime = [
  {
    id: 1,
    title: "Solo Leveling",
    coverImage: "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=400&q=80",
    rating: 9.1,
    episodes: 12,
    rank: 1,
    genres: ["Action", "Fantasy"],
    isNew: true,
  },
  {
    id: 2,
    title: "Frieren: Beyond Journey's End",
    coverImage: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&q=80",
    rating: 9.3,
    episodes: 28,
    rank: 2,
    genres: ["Adventure", "Fantasy"],
    isNew: false,
  },
  {
    id: 3,
    title: "Oshi no Ko",
    coverImage: "https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=400&q=80",
    rating: 8.9,
    episodes: 11,
    rank: 3,
    genres: ["Drama", "Mystery"],
    isNew: true,
  },
  {
    id: 4,
    title: "Chainsaw Man",
    coverImage: "https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&q=80",
    rating: 8.8,
    episodes: 12,
    rank: 4,
    genres: ["Action", "Horror"],
    isNew: false,
  },
  {
    id: 5,
    title: "Spy x Family",
    coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80",
    rating: 8.7,
    episodes: 25,
    rank: 5,
    genres: ["Comedy", "Action"],
    isNew: false,
  },
  {
    id: 6,
    title: "Vinland Saga S2",
    coverImage: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80",
    rating: 9.0,
    episodes: 24,
    rank: 6,
    genres: ["Action", "Drama"],
    isNew: true,
  },
  {
    id: 7,
    title: "My Hero Academia S7",
    coverImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
    rating: 8.4,
    episodes: 21,
    rank: 7,
    genres: ["Action", "Superhero"],
    isNew: true,
  },
  {
    id: 8,
    title: "One Piece",
    coverImage: "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&q=80",
    rating: 8.9,
    episodes: 1100,
    rank: 8,
    genres: ["Adventure", "Action"],
    isNew: false,
  },
];

interface TrendingCarouselProps {
  className?: string;
}

export function TrendingCarousel({ className }: TrendingCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  const scrollPrev = () => api?.scrollPrev();
  const scrollNext = () => api?.scrollNext();

  return (
    <section className={cn("py-8", className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/30 blur-lg rounded-full" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Trending Now
              </span>
            </h2>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: false,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 md:-ml-6">
            {trendingAnime.map((anime, index) => (
              <CarouselItem
                key={anime.id}
                className="pl-4 md:pl-6 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link href={`/anime/${anime.id}`}>
                    <div className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                      {/* Image */}
                      <Image
                        src={anime.coverImage}
                        alt={anime.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                      {/* Rank Badge */}
                      <div className="absolute top-3 left-3 flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 font-bold text-white text-sm shadow-lg">
                        {anime.rank}
                      </div>

                      {/* New Badge */}
                      {anime.isNew && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-2 py-1">
                            NEW
                          </Badge>
                        </div>
                      )}

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-14 h-14 rounded-full bg-white/40 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                          <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="font-semibold text-white text-sm md:text-base mb-1 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                          {anime.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{anime.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{anime.episodes} Eps</span>
                        </div>

                        {/* Genres on Hover */}
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {anime.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

export default TrendingCarousel;
