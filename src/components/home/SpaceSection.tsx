"use client";

import { motion, useAnimation } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, ChevronLeft, ChevronRight, Tv, Zap, Flame, Sparkles, type LucideIcon } from "lucide-react";
import { FavoriteButton } from "@/components/ui/FavoriteButton";

const ICONS: Record<string, LucideIcon> = { Star, Zap, Flame, Sparkles, Tv };
import { useRef } from "react";

export interface AnimeCard {
    id: string;
    title: string;
    slug: string;
    image: string | null;
    type?: string;
    status?: string;
    rating?: number | null;
    episodes?: number | null;
    synopsis?: string | null;
    genres?: string[];
}

export function SpaceCard({ anime, variant = "space" }: { anime: AnimeCard; index?: number; variant?: "fire" | "space" }) {
    const isFire = variant === "fire";
    return (
        <div
            className="group relative flex-none w-full sm:w-[200px] z-10 hover:z-30 cursor-pointer hover:-translate-y-2 hover:scale-[1.03] transition-transform duration-150"
        >
            <Link
                suppressHydrationWarning
                href={`/anime/${anime.slug}`}
                className={`block relative w-full aspect-[3/4] rounded-[1.5rem] overflow-hidden shadow-lg bg-[#0B0033] border border-white/10 transition-all duration-150 ${
                    isFire
                        ? "group-hover:border-[#FFD700]/60 group-hover:shadow-[0_10px_30px_rgba(255,85,0,0.3)]"
                        : "group-hover:border-[#00F0FF]/50 group-hover:shadow-[0_10px_30px_rgba(0,240,255,0.2)]"
                }`}
            >
                {anime.image ? (
                    <Image
                        src={anime.image}
                        alt={anime.title}
                        fill
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 150px, 200px"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B0033]">
                        <Tv className="w-12 h-12 text-[#00F0FF]/30 mb-2" />
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/20 opacity-90 group-hover:opacity-100 transition-opacity duration-150" />

                {/* Badges */}
                <div className="absolute top-3 inset-x-3 flex justify-between items-start z-10 pointer-events-none">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-md border-transparent ${
                        isFire ? "bg-[#FF5500] text-white" : "bg-[#00F0FF] text-black"
                    }`}>
                        {anime.type || "TV"}
                    </span>
                    <div className="flex flex-col gap-2 items-end pointer-events-auto">
                        <FavoriteButton
                            anime={{
                                id: anime.id, slug: anime.slug, title: anime.title,
                                image: anime.image || '', type: anime.type, rating: anime.rating
                            }}
                            className={`bg-black/60 p-1.5 rounded-full border border-white/20 shadow-md backdrop-blur-md transition-colors w-7 h-7 sm:w-8 sm:h-8 ${
                                isFire ? "hover:bg-[#FF5500]/20 hover:border-[#FFD700]" : "hover:bg-[#00F0FF]/20 hover:border-[#00F0FF]"
                            }`}
                        />
                        {anime.rating && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/80 border border-white/20 text-white text-[10px] sm:text-[11px] font-bold shadow-md backdrop-blur-md">
                                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-[#FFD700]" />
                                {anime.rating.toFixed(1)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Play Button - instant hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 pointer-events-none">
                    <div className={`w-14 h-14 rounded-full backdrop-blur-sm flex items-center justify-center ${
                        isFire
                            ? "bg-[#FF5500]/90 border-2 border-[#FFD700] shadow-[0_0_25px_rgba(255,85,0,0.7)]"
                            : "bg-[#00F0FF]/80 border-2 border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.6)]"
                    }`}>
                        <Play className={`w-6 h-6 fill-current translate-x-[2px] ${isFire ? "text-white fill-white" : "text-black fill-black"}`} />
                    </div>
                </div>
            </Link>

            {/* Title Below */}
            <h3 className={`mt-3 text-sm sm:text-base font-bold text-center line-clamp-2 text-gray-200 transition-colors duration-150 px-1 leading-tight ${
                isFire ? "group-hover:text-[#FFD700]" : "group-hover:text-[#00F0FF]"
            }`}>
                {anime.title}
            </h3>
            {anime.episodes && (
                <p className={`text-xs sm:text-sm font-bold text-center mt-1.5 ${
                    isFire ? "text-[#FF5500]" : "text-[#00F0FF]"
                }`}>
                    {anime.episodes} حلقة
                </p>
            )}
        </div>
    );
}

// ── Clean Horizontal Section ───────────────────────
export function SpaceSection({
    title,
    icon,
    items,
}: {
    title: string;
    icon: string;
    items: AnimeCard[];
}) {
    const Icon = ICONS[icon] ?? Star;
    const carouselRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    // Instead of native scroll, we use Framer Motion useAnimation hook to slide
    const controls = useAnimation();
    // (Note: we use a simpler approach below with a direct ref scroll if framer drag gets tricky,
    // but the user expressly wants the exact same "swipe" feeling back plus working arrows.
    // We will use native smooth scrolling but bind the arrows accurately)

    const scroll = (dir: "l" | "r") => {
        if (!innerRef.current || !carouselRef.current) return;

        const currentX = innerRef.current.getBoundingClientRect().x - carouselRef.current.getBoundingClientRect().x;
        const scrollAmount = window.innerWidth > 640 ? 600 : 300;
        let newX = currentX + (dir === "l" ? scrollAmount : -scrollAmount);

        // Calculate boundaries
        const innerWidth = innerRef.current.scrollWidth;
        const carouselWidth = carouselRef.current.offsetWidth;

        const maxScroll = 0; // Leftmost position
        const minScroll = -(innerWidth - carouselWidth); // Rightmost position

        // Clamp newX within boundaries
        newX = Math.max(minScroll, Math.min(maxScroll, newX));

        controls.start({ x: newX, transition: { duration: 0.5, ease: "easeOut" } });
    };

    if (!items.length) return null;

    return (
        <section className="py-8 relative z-10">
            <div className="flex items-center justify-between mb-6 px-4 sm:px-8">
                <motion.div
                    className="flex items-center gap-3"
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className={`p-2 rounded-full bg-white/10 text-white`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <h2 className={`text-2xl font-black tracking-wide text-white`}>
                        {title}
                    </h2>
                </motion.div>
            </div>

            {/* Cards container */}
            <div className="relative group/carousel" ref={carouselRef}>
                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

                <button
                    onClick={() => scroll("r")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-[#00F0FF]/20 hover:border-[#00F0FF]/50 transition-all opacity-0 group-hover/carousel:opacity-100 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] hidden sm:block"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
                <button
                    onClick={() => scroll("l")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-[#00F0FF]/20 hover:border-[#00F0FF]/50 transition-all opacity-0 group-hover/carousel:opacity-100 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] hidden sm:block"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="overflow-hidden pb-8 pt-4 px-4 sm:px-8">
                    <motion.div
                        ref={innerRef}
                        animate={controls}
                        drag="x"
                        dragConstraints={carouselRef}
                        dragElastic={0.12}
                        whileTap={{ cursor: "grabbing" }}
                        className="flex gap-4 sm:gap-6 cursor-grab w-max"
                    >
                        {items.map((a, i) => (
                            <div key={a.slug + i} className="w-[180px] sm:w-[200px] flex-none pointer-events-none sm:pointer-events-auto">
                                <div className="pointer-events-auto w-full h-full">
                                    <SpaceCard anime={a} />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
