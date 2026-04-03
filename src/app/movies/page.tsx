import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnimeCard } from '@/components/AnimeCard';
import { animeService } from '@/lib/UnifiedAnimeService';

export const dynamic = 'force-dynamic';

async function fetchMovies() {
    // Basic implementation using service
    return await animeService.getTopRated(60); 
}

export default async function MoviesPage() {
    const items = await fetchMovies();

    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white font-sans selection:bg-white/30" dir="rtl">
            <Header />

            <main className="container mx-auto px-4 pt-32 pb-20 max-w-[1600px]">
                <h1 className="text-4xl sm:text-5xl font-black mb-10 text-white border-b border-rose-500/30 pb-6 inline-block">
                    الأفلام
                </h1>
                <p className="text-gray-400 mb-8 -mt-6">مكتبة ضخمة تضم أروع أفلام الأنمي بأعلى جودة.</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
                    {items.map((anime: any, index: number) => (
                        <AnimeCard key={anime.slug + index} anime={anime} />
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
