"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Flame, Sparkles, Star } from "lucide-react";
import { SpaceCard, AnimeCard } from "./SpaceSection";

export function SeasonalSection({
    title,
    items,
}: {
    title: string;
    items: AnimeCard[];
}) {
    if (!items.length) return null;

    return (
        <section className="py-16 relative z-10 my-12 sm:my-16 overflow-hidden">
            {/* Cinematic fire-themed background matching the slider */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5500]/10 via-[#E52E71]/5 to-[#FFD700]/10 rounded-[3rem] pointer-events-none border border-[#FF5500]/20 shadow-[inset_0_0_150px_rgba(229,46,113,0.08)] backdrop-blur-sm" />
            
            {/* Animated glowing top border */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent shadow-[0_0_30px_rgba(255,213,0,1)] opacity-80" />
            
            {/* Glowing orbs */}
            <div className="absolute top-[-50px] left-[10%] w-[200px] h-[200px] bg-[#FF5500]/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-50px] right-[10%] w-[250px] h-[250px] bg-[#E52E71]/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center justify-between mb-12 px-4 sm:px-10 relative z-10">
                <motion.div
                    className="flex items-center gap-5"
                    initial={{ x: -30, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFD700] to-[#FF5500] text-white shadow-[0_0_50px_rgba(255,85,0,0.6)] relative overflow-hidden group">
                        <Flame className="w-10 h-10 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                        <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFD700] to-[#FF5500] drop-shadow-lg tracking-tight">
                            {title}
                        </h2>
                        <p className="text-[#FF5500]/90 text-base mt-2 font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#FFD700]" /> 
                            الأعمال الأكثر ترقباً والمنتظرة بقوة
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="hidden sm:block"
                >
                    <Link
                        href="/series"
                        className="group flex items-center gap-2 text-white font-bold px-8 py-3 rounded-full border border-[#FF5500]/30 hover:border-[#FFD700] bg-[#FF5500]/10 hover:bg-[#FFD700]/20 transition-all shadow-[0_0_20px_rgba(255,85,0,0.2)] hover:shadow-[0_0_30px_rgba(255,213,0,0.4)] overflow-hidden relative"
                    >
                        <span className="relative z-10">تصفح القائمة</span>
                        <ChevronLeft className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-8 px-4 sm:px-10 relative z-10">
                {items.slice(0, 12).map((a, i) => (
                    <div key={a.slug + i} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-b from-[#FFD700] to-[#FF5500] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-150" />
                        <div className="relative">
                            <SpaceCard anime={a} variant="fire" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
