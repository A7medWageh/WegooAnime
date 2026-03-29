"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, Infinity as InfinityIcon, Compass } from "lucide-react";
import { AnimeCard } from "./SpaceSection";

export function CosmicHero({ items }: { items: AnimeCard[] }) {
    const [idx, setIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const heroItems = items.filter((a) => a.image).slice(0, 7);

    useEffect(() => {
        if (isHovered || !heroItems.length) return;
        const t = setInterval(
            () => setIdx((i) => (i + 1) % heroItems.length),
            8000,
        );
        return () => clearInterval(t);
    }, [isHovered, heroItems.length]);

    if (!heroItems.length) return null;
    const curr = heroItems[idx];

    return (
        <div
            className="relative w-full h-[88vh] sm:h-[95vh] overflow-hidden rounded-b-[3rem] sm:rounded-b-[4rem] border-b border-white/10 bg-[#050505] shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setTimeout(() => setIsHovered(false), 1000)}
        >
            {/* Dynamic Background Transitions */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={idx}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    {/* Dual-layer rendering for 4K Premium Effect from Posters */}
                    <Image
                        src={curr.image!}
                        alt={curr.title}
                        fill
                        className="object-cover object-center opacity-80 saturate-150"
                        sizes="100vw"
                        priority
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-[#050505]/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />

                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 flex items-center px-6 sm:px-16 lg:px-24 container mx-auto pt-24 pb-10">
                <div className="flex w-full items-center justify-between gap-10">
                    {/* Text Content */}
                    <div className="w-full lg:w-[60%] relative z-20">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            >
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#0055FF] text-white text-xs font-black tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                                        {curr.type || "TV"}
                                    </span>
                                    {curr.rating && (
                                        <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-bold border border-white/20">
                                            <Star className="w-4 h-4 fill-current text-yellow-400" />
                                            {curr.rating.toFixed(1)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/80 text-sm font-bold border border-white/20">
                                        <InfinityIcon className="w-4 h-4" /> حصرياً
                                    </span>
                                </div>

                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 text-white leading-[1.15] drop-shadow-2xl">
                                    {curr.title}
                                </h1>

                                {curr.synopsis && (
                                    <p className="text-gray-300 text-lg sm:text-xl mb-10 line-clamp-3 leading-relaxed max-w-2xl font-medium drop-shadow-md border-r-4 border-[#00F0FF] pr-4">
                                        {curr.synopsis}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-4 sm:gap-6">
                                    <Link
                                        href={`/watch/${curr.slug}`}
                                        className="relative inline-flex group overflow-hidden rounded-full p-[2px]"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-[#00F0FF] to-[#0055FF] rounded-full opacity-100 group-hover:opacity-80 transition-opacity duration-300" />
                                        <div className="relative flex items-center gap-3 px-8 sm:px-10 py-4 bg-[#050505] text-white rounded-full transition-all duration-300 group-hover:bg-transparent shadow-2xl">
                                            <Play className="w-6 h-6 fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] group-hover:scale-110 transition-transform" />
                                            <span className="font-extrabold text-lg sm:text-xl tracking-wide">
                                                المشاهدة الان
                                            </span>
                                        </div>
                                    </Link>

                                    <Link
                                        href={`/anime/${curr.slug}`}
                                        className="flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 backdrop-blur-xl hover:bg-white/15 text-white font-bold transition-all border border-white/20 hover:border-white/40 shadow-xl text-lg relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                                        <Compass className="w-6 h-6" /> تفاصيل أكثر
                                    </Link>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Spectacular Circular Side Poster */}
                    <div className="hidden lg:flex relative z-20 w-[45%] justify-end items-center perspective-1000 pr-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="relative w-96 h-96 sm:w-[28rem] sm:h-[28rem] xl:w-[32rem] xl:h-[32rem] rounded-full overflow-hidden shadow-[0_0_80px_rgba(0,191,255,0.4),inset_0_0_40px_rgba(255,255,255,0.5)] border-[6px] border-white/10 group cursor-pointer hover:border-[#00BFFF]/50 transition-all duration-700"
                            >
                                {/* Lightweight Glowing Overlay inside Circle */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00BFFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />

                                <Image src={curr.image!} alt={curr.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out will-change-transform" priority />

                                {/* Optimized Play Button link (No Shimmer or Backdrop Blur) */}
                                <Link href={`/watch/${curr.slug}`} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30 ring-0 outline-none">
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#00BFFF]/70 flex items-center justify-center border border-white/50 scale-50 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_40px_rgba(0,191,255,0.6)] will-change-transform">
                                        <Play className="w-12 h-12 sm:w-14 sm:h-14 text-white fill-white ml-2 translate-x-1" />
                                    </div>
                                </Link>

                                {/* CSS Based Rotating Border Glow Effect Overlay (More performant than JS) */}
                                <div
                                    className="absolute inset-[-6px] rounded-full border-[8px] border-transparent border-t-[#00BFFF] border-b-[#1E90FF] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-40 pointer-events-none animate-[spin_8s_linear_infinite]"
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Progress Track Dots */}
            <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-30 hidden sm:flex">
                {heroItems.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIdx(i)}
                        className={`w-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)] overflow-hidden relative ${i === idx ? "h-10 bg-white/20" : "h-2.5 bg-white/30 hover:bg-white/50"}`}
                    >
                        {i === idx && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "100%" }}
                                transition={{ duration: 8, ease: "linear" }}
                                className="absolute top-0 left-0 w-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]"
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
