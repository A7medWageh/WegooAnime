"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy, Star, Play, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Mock top rated anime data
const topRatedAnime = [
  {
    id: 1,
    title: "Fullmetal Alchemist: Brotherhood",
    coverImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
    rating: 9.5,
    year: 2009,
    episodes: 64,
    genres: ["Action", "Adventure", "Drama"],
    rank: 1,
  },
  {
    id: 2,
    title: "Steins;Gate",
    coverImage: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&q=80",
    rating: 9.4,
    year: 2011,
    episodes: 24,
    genres: ["Sci-Fi", "Thriller", "Drama"],
    rank: 2,
  },
  {
    id: 3,
    title: "Gintama°",
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
    rating: 9.3,
    year: 2015,
    episodes: 51,
    genres: ["Comedy", "Action", "Parody"],
    rank: 3,
  },
  {
    id: 4,
    title: "Hunter x Hunter (2011)",
    coverImage: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&q=80",
    rating: 9.2,
    year: 2011,
    episodes: 148,
    genres: ["Action", "Adventure", "Fantasy"],
    rank: 4,
  },
  {
    id: 5,
    title: "Legend of the Galactic Heroes",
    coverImage: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80",
    rating: 9.2,
    year: 1988,
    episodes: 110,
    genres: ["Sci-Fi", "Drama", "Military"],
    rank: 5,
  },
  {
    id: 6,
    title: "Mob Psycho 100 III",
    coverImage: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&q=80",
    rating: 9.1,
    year: 2022,
    episodes: 12,
    genres: ["Action", "Comedy", "Supernatural"],
    rank: 6,
  },
  {
    id: 7,
    title: "Kaguya-sama: Love is War",
    coverImage: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=400&q=80",
    rating: 9.0,
    year: 2019,
    episodes: 37,
    genres: ["Comedy", "Romance", "Psychological"],
    rank: 7,
  },
  {
    id: 8,
    title: "Violet Evergarden",
    coverImage: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&q=80",
    rating: 9.0,
    year: 2018,
    episodes: 13,
    genres: ["Drama", "Fantasy", "Slice of Life"],
    rank: 8,
  },
];

interface TopRatedSectionProps {
  className?: string;
}

export function TopRatedSection({ className }: TopRatedSectionProps) {
  const [hoveredId, setHoveredId] = React.useState<number | null>(null);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-amber-500";
    if (rank === 2) return "from-gray-300 to-gray-400";
    if (rank === 3) return "from-amber-600 to-orange-700";
    return "from-violet-500 to-cyan-500";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "👑";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <section className={cn("py-8", className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div className="absolute inset-0 bg-yellow-400/30 blur-lg rounded-full" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Top Rated
            </span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
          {topRatedAnime.map((anime, index) => (
            <motion.div
              key={anime.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Link href={`/anime/${anime.id}`}>
                <div
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer"
                  onMouseEnter={() => setHoveredId(anime.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Image */}
                  <Image
                    src={anime.coverImage}
                    alt={anime.title}
                    fill
                    className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                  {/* Glassmorphism Hover Effect */}
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: hoveredId === anime.id ? 1 : 0,
                    }}
                    className="absolute inset-0 bg-gradient-to-t from-violet-900/20 to-cyan-900/20"
                  />

                  {/* Rank Badge */}
                  <div
                    className={cn(
                      "absolute top-3 left-3 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br font-bold text-white text-sm shadow-lg",
                      getRankColor(anime.rank)
                    )}
                  >
                    {getRankBadge(anime.rank)}
                  </div>

                  {/* Favorite Button */}
                  <button
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-pink-500/80 hover:scale-110 shadow-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add to favorites logic
                    }}
                  >
                    <Heart className="w-4 h-4 text-white" />
                  </button>

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: hoveredId === anime.id ? 1 : 0.5,
                      }}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center shadow-xl shadow-violet-500/30"
                    >
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </motion.div>
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute top-14 right-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/80 shadow-md">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs font-bold">{anime.rating}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white text-sm md:text-base mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                      {anime.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{anime.year}</span>
                      <span>•</span>
                      <span>{anime.episodes} Eps</span>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {anime.genres.slice(0, 2).map((genre) => (
                        <Badge
                          key={genre}
                          variant="secondary"
                          className="text-[10px] px-2 py-0 h-auto bg-white/10 text-gray-300 border-0 hover:bg-violet-500/30 transition-colors"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center mt-8">
          <Link href="/browse?sort=rating">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600/80 to-cyan-600/80 text-white font-medium hover:from-violet-500 hover:to-cyan-500 transition-all duration-300 shadow-md"
            >
              View All Top Anime
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default TopRatedSection;
