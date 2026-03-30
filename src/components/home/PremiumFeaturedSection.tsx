"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Star, Zap, Flame, Sparkles, type LucideIcon } from "lucide-react";
import { SpaceCard, AnimeCard } from "./SpaceSection";

const ICONS: Record<string, LucideIcon> = { Star, Zap, Flame, Sparkles };

// ── Premium Featured Section for New Episodes ───────────────────────
export function PremiumFeaturedSection({
    title,
    icon,
    items,
}: {
    title: string;
    icon: string;
    items: AnimeCard[];
}) {
    const Icon = ICONS[icon] ?? Zap;
    if (!items.length) return null;

    return (
        <section className="py-12 relative z-10 my-8 sm:my-12">
            {/* Background glow for the premium section */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/10 via-[#00F0FF]/5 to-transparent rounded-[3rem] pointer-events-none border border-[#00F0FF]/10 shadow-[inset_0_0_100px_rgba(0,240,255,0.05)]" />
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/80 to-transparent shadow-[0_0_20px_rgba(0,240,255,0.8)]" />

            <div className="flex flex-col sm:flex-row items-center justify-between mb-10 px-4 sm:px-8">
                <motion.div
                    className="flex items-center gap-4"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#0055FF] text-white shadow-[0_0_40px_rgba(0,240,255,0.5)] relative overflow-hidden">
                        <div
                            className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-30 animate-spin-slow"
                        />
                        <Icon className="w-8 h-8 relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00F0FF] drop-shadow-md">
                            {title}
                        </h2>
                        <p className="text-[#00F0FF]/70 text-sm mt-1.5 font-bold">
                            شاهد أحدث الحلقات المضافة حصرياً لك
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="hidden sm:block"
                >
                    <Link
                        href="/series"
                        className="group flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-full border border-white/20 hover:border-[#00F0FF] hover:bg-[#00F0FF]/10 transition-all shadow-lg overflow-hidden relative"
                    >
                        <span className="relative z-10">عرض كل الحلقات</span>
                        <ChevronLeft className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/0 via-[#00F0FF]/20 to-transparent translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000" />
                    </Link>
                </motion.div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6 px-3 sm:px-8">
                {items.slice(0, 12).map((a, i) => (
                    <SpaceCard key={a.slug + i} anime={a} index={i} />
                ))}
            </div>
        </section>
    );
}
