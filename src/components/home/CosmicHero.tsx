"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, Infinity as InfinityIcon, Compass, Sparkles } from "lucide-react";
import { AnimeCard } from "./SpaceSection";

export function CosmicHero({ items }: { items: AnimeCard[] }) {
    const [idx, setIdx] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const heroItems = items.filter((a) => a.image).slice(0, 10);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !heroItems.length || isPaused) return;
        const t = setInterval(
            () => setIdx((i) => (i + 1) % heroItems.length),
            6000,
        );
        return () => clearInterval(t);
    }, [heroItems.length, mounted, isPaused]);

    // Auto-pause on hover
    useEffect(() => {
        const handleMouseEnter = () => setIsPaused(true);
        const handleMouseLeave = () => setIsPaused(false);
        
        const heroElement = document.querySelector('[data-hero-container]');
        if (heroElement) {
            heroElement.addEventListener('mouseenter', handleMouseEnter);
            heroElement.addEventListener('mouseleave', handleMouseLeave);
        }
        
        return () => {
            if (heroElement) {
                heroElement.removeEventListener('mouseenter', handleMouseEnter);
                heroElement.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, []);

    if (!heroItems.length) return null;
    const curr = heroItems[idx];

    return (
        <div data-hero-container className="relative w-full h-[100svh] sm:h-[95vh] overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[4rem] bg-[#020202] shadow-[0_30px_100px_rgba(255,85,0,0.15)]">

            {/* ── Full Bleed Background (single live layer — was 10× full-viewport images) ── */}
            <div className="absolute inset-0 z-0">
                {mounted && curr.image && (
                    <div className="absolute inset-0">
                        <Image
                            key={curr.slug}
                            src={curr.image}
                            alt={curr.title}
                            fill
                            className="object-cover object-center saturate-150 opacity-60"
                            sizes="100vw"
                            priority={idx === 0}
                            fetchPriority={idx === 0 ? "high" : "low"}
                        />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/75 to-[#020202]/30 z-20 pointer-events-none sm:hidden" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-[#020202]/80 to-transparent z-20 pointer-events-none hidden sm:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#020202]/50 via-transparent to-[#020202]/60 z-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF5500]/20 via-transparent to-[#7928CA]/20 mix-blend-overlay z-20 pointer-events-none" />
            </div>

            {/* ══════════════════════════════════════
                MOBILE LAYOUT (hidden on sm+)
            ══════════════════════════════════════ */}
            <div className="sm:hidden absolute inset-0 z-30 flex flex-col items-center justify-center px-5 gap-5">

                {/* Large Centered Poster */}
                <AnimatePresence mode="wait">
                    {mounted && (
                        <motion.div
                            key={idx + "mob-poster"}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="relative w-[210px] h-[300px] rounded-2xl overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.95),0_0_40px_rgba(255,85,0,0.45)] border-2 border-white/15 shrink-0"
                        >
                            <Image 
                                src={curr.image!} 
                                alt={curr.title} 
                                fill 
                                className="object-cover" 
                                priority={idx === 0}
                                placeholder="blur"
                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-[#FFD700]/40 via-[#FF5500]/20 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info Section immediately below poster */}
                <AnimatePresence mode="wait">
                    {mounted && (
                        <motion.div
                            key={idx + "mob-text"}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex flex-col items-center text-center w-full"
                        >
                        {/* Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FFD700] via-[#FF5500] to-[#E52E71] text-white text-[10px] font-black tracking-widest shadow-[0_0_12px_rgba(255,85,0,0.5)] flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> {curr.type || "TV"}
                            </span>
                            {curr.rating && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                                    <Star className="w-3 h-3 fill-current text-[#FFD700]" />
                                    {curr.rating.toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-xl leading-[1.2] font-black mb-1.5 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] line-clamp-1 px-2 w-full">
                            {curr.title}
                        </h1>

                        {/* Synopsis */}
                        <p className="text-gray-300 text-[11px] leading-relaxed mb-4 max-w-sm px-2 line-clamp-2" style={{ minHeight: '30px', maxHeight: '60px' }}>
                            {curr.synopsis || `استعد لمغامرة ملحمية في عالم ${curr.title} حيث يواجه البطل تحديات خارقة للعادة، ويكتشف أسراراً كانت مخبأة في الظلام. انضم إلى رحلة مليئة بالإثارة والحركة، وقصص مؤثرة ستبقى في ذاكرتك طويلاً.`}
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3 w-full max-w-sm">
                            <Link
                                href={`/watch/${curr.slug}`}
                                className="relative flex-1 inline-flex group/btn overflow-hidden rounded-full p-[2px] shadow-[0_0_18px_rgba(255,85,0,0.45)]"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#FF5500] to-[#E52E71] rounded-full" />
                                <div className="relative flex items-center justify-center gap-2 px-5 py-2.5 bg-[#060606] text-white rounded-full w-full group-hover/btn:bg-transparent transition-colors">
                                    <Play className="w-4 h-4 fill-white shrink-0" />
                                    <span className="font-extrabold text-sm whitespace-nowrap">بدء المشاهدة</span>
                                </div>
                            </Link>
                            <Link
                                href={`/anime/${curr.slug}`}
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-xl text-white font-bold transition-all border border-white/20 text-sm whitespace-nowrap"
                            >
                                <Compass className="w-4 h-4 text-[#FFD700] shrink-0" />
                                تفاصيل
                            </Link>
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
            </div>


            {/* ══════════════════════════════════════
                DESKTOP LAYOUT (hidden on mobile)
            ══════════════════════════════════════ */}
            <div className="hidden sm:flex absolute inset-0 flex-col justify-center px-16 lg:px-24 container mx-auto pt-20 pb-20 z-30">
                <div className="flex w-full items-center justify-between gap-12 max-h-full h-full">

                    {/* Text Content */}
                    <div className="w-full lg:w-[60%] xl:w-[55%] relative z-30 flex flex-col justify-center max-h-full h-full">
                        <AnimatePresence mode="wait">
                            {mounted && (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                    className="flex flex-col justify-center h-full max-h-full py-4 sm:py-0 overflow-visible"
                                >
                                <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6 shrink-0 mt-4 sm:mt-10">
                                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700] via-[#FF5500] to-[#E52E71] text-white text-xs sm:text-sm font-black tracking-widest shadow-[0_0_20px_rgba(255,85,0,0.5)] flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                        <Sparkles className="w-4 h-4" /> {curr.type || "TV"}
                                    </span>
                                    {curr.rating && (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-bold border border-white/20 shadow-lg whitespace-nowrap shrink-0">
                                            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                                            {curr.rating.toFixed(1)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#FFD700] text-xs sm:text-sm font-bold border border-white/20 shadow-lg whitespace-nowrap shrink-0">
                                        <InfinityIcon className="w-3 h-3 sm:w-4 sm:h-4" /> الملحمي
                                    </span>
                                </div>

                                <div className="shrink shrink-0 flex flex-col justify-center flex-grow-0 mb-4 sm:mb-6 lg:mb-8 min-h-0 overflow-hidden">
                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 leading-[1.1] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] line-clamp-2">
                                        {curr.title}
                                    </h1>
                                    <p className="text-gray-200 text-sm sm:text-base lg:text-lg xl:text-xl line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-3xl font-medium drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] border-r-4 border-[#FF5500] pr-4 sm:pr-5 py-1 min-h-[50px] sm:min-h-[85px] max-h-[120px]">
                                        {curr.synopsis || `انطلق في رحلة لا تُنسى مع ${curr.title}! قصة ملحمية تجمع بين الأكشن المشوق والدراما العميقة، حيث يواجه الأبطال مصيرهم المحتوم في عالم مليء بالغموض والأسئلة. كل حلقة تحمل مفاجآت جديدة وتطورات مثيرة تشدك وتجعلك تنتظر المزيد بفارغ الصبر.`}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 shrink-0 mt-auto sm:mt-0 mb-8 sm:mb-10 lg:mb-12">
                                    <Link
                                        href={`/watch/${curr.slug}`}
                                        className="relative inline-flex group/btn overflow-hidden rounded-full p-[2px] shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_40px_rgba(255,85,0,0.6)] transition-shadow duration-500 w-full sm:w-auto shrink-0 justify-center"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#FF5500] to-[#E52E71] rounded-full opacity-80 group-hover/btn:opacity-100 transition-opacity" />
                                        <div className="relative flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-10 py-3 sm:py-3.5 bg-[#050505] text-white rounded-full transition-colors duration-300 group-hover/btn:bg-opacity-0 w-full shrink-0">
                                            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] group-hover/btn:scale-110 transition-transform duration-300 shrink-0" />
                                            <span className="font-extrabold text-base sm:text-lg tracking-wide group-hover/btn:text-white drop-shadow-md whitespace-nowrap">بدء المشاهدة</span>
                                        </div>
                                    </Link>

                                    <Link
                                        href={`/anime/${curr.slug}`}
                                        className="flex shrink-0 items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white font-bold transition-all border border-white/20 hover:border-[#FFD700] shadow-xl text-sm sm:text-base relative overflow-hidden group/info w-full sm:w-auto"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/info:translate-x-full duration-1000 transition-transform ease-out" />
                                        <Compass className="w-5 h-5 sm:w-6 sm:h-6 group-hover/info:rotate-45 transition-transform duration-500 text-[#FFD700] shrink-0" />
                                        <span className="whitespace-nowrap flex-shrink-0">تفاصيل الأعمال</span>
                                    </Link>
                                </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Epic 3D Floating Poster (Desktop only) */}
                    <div className="hidden lg:flex relative z-30 w-[40%] xl:w-[45%] justify-end items-center perspective-1000 pr-4 xl:pr-10 shrink-0 mt-6 mb-6">
                        <AnimatePresence mode="wait">
                            {mounted && (
                                <motion.div
                                    key={idx + "desk-poster"}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    style={{ transformPerspective: 1200 }}
                                    className="relative w-[280px] h-[400px] xl:w-[350px] xl:h-[500px] rounded-3xl overflow-hidden shadow-[10px_15px_40px_rgba(0,0,0,0.8),0_0_50px_rgba(255,85,0,0.2)] border border-white/10 group/poster cursor-pointer hover:scale-105 transition-transform duration-300 bg-black mx-10 shrink-0"
                                >
                                <div className="absolute -inset-10 bg-gradient-to-tr from-[#FF5500] to-[#E52E71] rounded-3xl blur-3xl opacity-0 group-hover/poster:opacity-50 transition-opacity duration-700 -z-10" />
                                <Image 
                                    src={curr.image!} 
                                    alt={curr.title} 
                                    fill 
                                    className="object-cover group-hover/poster:scale-105 transition-transform duration-700 ease-out" 
                                    priority={idx === 0}
                                    placeholder="blur"
                                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                <Link href={`/watch/${curr.slug}`} className="absolute inset-0 opacity-0 group-hover/poster:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center z-30">
                                    <div className="absolute inset-0 bg-[#FF5500]/20 backdrop-blur-sm" />
                                    <div className="relative w-20 h-20 rounded-full bg-white/10 border border-white/40 flex items-center justify-center scale-75 group-hover/poster:scale-100 transition-transform duration-500 shadow-[0_0_40px_rgba(255,85,0,0.7)] backdrop-blur-md">
                                        <Play className="w-8 h-8 text-white fill-white translate-x-[2px]" />
                                    </div>
                                    <span className="relative mt-5 text-white font-black text-lg xl:text-xl tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] translate-y-2 group-hover/poster:translate-y-0 transition-transform duration-500">شاهد الآن</span>
                                </Link>
                                <div className="absolute inset-0 border-[2px] border-white/10 rounded-3xl pointer-events-none group-hover/poster:border-white/50 transition-colors duration-500" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Progress Bars (shared) ── */}
            <div className="absolute bottom-5 sm:bottom-8 left-0 right-0 flex justify-center gap-2 sm:gap-3 z-40 px-4">
                {mounted && heroItems.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIdx(i)}
                        className={`relative h-1.5 sm:h-2 rounded-full overflow-hidden transition-all duration-500 cursor-pointer ${
                            i === idx ? "w-12 sm:w-20 bg-white/20" : "w-5 sm:w-8 bg-white/10 hover:bg-white/30"
                        }`}
                    >
                        {i === idx && (
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 6, ease: "linear" }}
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FFD700] via-[#FF5500] to-[#E52E71]"
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
