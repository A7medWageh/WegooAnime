'use client';

import { useFavorites } from '@/context/FavoritesContext';
import { SpaceCard } from '@/components/home/SpaceSection';
import { Heart, Disc, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function FavoritesPage() {
    const { favorites } = useFavorites();

    return (
        <main className="min-h-screen pt-24 pb-20 relative px-4 sm:px-8 overflow-hidden">
            {/* Full-width Image Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=2560"
                    alt="Favorites Background"
                    fill
                    className="object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-[#030014]/80 to-[#030014] pointer-events-none" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-none" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 w-full">
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold text-gray-300 hover:text-white transition-all mb-8 group w-fit">
                    <ChevronRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    الرجوع للموقع
                </Link>

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 bg-white/5 p-6 sm:p-8 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                        <Heart className="w-7 h-7 text-red-500 fill-red-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white">قائمة المفضلة</h1>
                        <p className="text-gray-400 mt-1">الأنميات التي قمت بحفظها للمشاهدة لاحقاً ({favorites.length})</p>
                    </div>
                </div>

                {/* Content */}
                {favorites.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {favorites.map((anime, idx) => (
                            <SpaceCard
                                key={anime.id}
                                index={idx}
                                anime={{
                                    id: anime.id,
                                    slug: anime.slug,
                                    title: anime.title,
                                    image: anime.image,
                                    type: anime.type,
                                    rating: anime.rating,
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 text-center bg-white/5 rounded-[3rem] border border-white/5"
                    >
                        <Disc className="w-24 h-24 text-gray-500 mb-6 opacity-50" />
                        <h2 className="text-2xl font-bold text-white mb-2">قائمتك فارغة تماماً!</h2>
                        <p className="text-gray-400 max-w-md mx-auto mb-8">
                            يبدو أنك لم تقم بإضافة أي أنمي إلى مفضلتك بعد. تصفح المجرة وابدأ في حفظ ما يعجبك.
                        </p>
                        <Link
                            href="/"
                            className="px-8 py-3 rounded-full bg-[#00F0FF] text-black font-bold hover:bg-white transition-colors"
                        >
                            العودة للرئيسية
                        </Link>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
