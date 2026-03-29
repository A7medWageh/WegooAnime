'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnimeCard } from '@/components/AnimeCard';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';

function SearchResults() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    const genre = searchParams.get('genre') || '';

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        let url = `/api/anime?action=search&limit=100`;
        if (q) url += `&q=${encodeURIComponent(q)}`;
        if (genre) url += `&genre=${encodeURIComponent(genre)}`;

        // Default fallback if no q and no genre
        if (!q && !genre) url = `/api/anime?action=list&sort=LATEST&limit=100`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.success) setResults(data.data || []);
            })
            .finally(() => setLoading(false));
    }, [q, genre]);

    return (
        <>
            <div className="mb-10 text-center">
                <h1 className="text-3xl sm:text-5xl font-black mb-4 text-white">
                    {q ? `نتائج البحث عن: ${q}` : genre ? `تصنيف: ${genre}` : 'أحدث الحلقات المضافة'}
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    {q || genre ? 'تصفح النتائج من السيرفرات العالمية.' : 'تصفح أحدث الأنميات المضافة حديثاً للمكتبة.'}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-white" />
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
                    {results.map((anime: any, i: number) => (
                        <motion.div
                            key={anime.slug + i}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 20) * 0.05 }}
                        >
                            <AnimeCard anime={anime} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-400">لا توجد نتائج مطابقة لبحثك</h2>
                </div>
            )}
        </>
    );
}

export default function SearchPage() {
    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white font-sans selection:bg-white/30" dir="rtl">
            <Header />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-[1600px]">
                <Suspense fallback={<div className="flex justify-center py-32"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>}>
                    <SearchResults />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
