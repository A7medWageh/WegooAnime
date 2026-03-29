import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Search } from 'lucide-react';

const GENRES = [
    { title: 'أكشن', name: 'Action', color: 'from-red-500/20 to-orange-500/20 border-red-500/30 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] text-red-500' },
    { title: 'رومانسي', name: 'Romance', color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] text-pink-500' },
    { title: 'كوميديا', name: 'Comedy', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] text-yellow-500' },
    { title: 'دراما', name: 'Drama', color: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] text-purple-500' },
    { title: 'مغامرات', name: 'Adventure', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] text-green-500' },
    { title: 'خيال', name: 'Fantasy', color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30 hover:border-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] text-indigo-500' },
    { title: 'خيال علمي', name: 'Sci-Fi', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] text-cyan-500' },
    { title: 'رعب', name: 'Horror', color: 'from-neutral-500/20 to-stone-500/20 border-neutral-500/30 hover:border-neutral-500 hover:shadow-[0_0_30px_rgba(115,115,115,0.3)] text-neutral-400' },
    { title: 'غموض', name: 'Mystery', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] text-violet-500' },
    { title: 'رياضة', name: 'Sports', color: 'from-blue-500/20 to-sky-500/20 border-blue-500/30 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] text-blue-500' },
    { title: 'شريحة من الحياة', name: 'Slice of Life', color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30 hover:border-teal-500 hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] text-teal-400' },
    { title: 'قوى خارقة', name: 'Supernatural', color: 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 hover:border-fuchsia-500 hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] text-fuchsia-500' },
];

export default function CategoriesPage() {
    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white font-sans selection:bg-white/30" dir="rtl">
            <Header />

            <main className="container mx-auto px-4 pt-32 pb-32 max-w-[1600px]">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-6xl font-black mb-6 text-white tracking-tight">
                        التصنيفات
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        استكشف عالم الأنمي من خلال تصنيفاتنا المتنوعة. اختر التصنيف الذي تفضله وابدأ رحلتك الآن في مشاهدة أجمل الأعمال.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {GENRES.map((genre) => (
                        <Link
                            key={genre.name}
                            href={`/search?genre=${genre.name.toLowerCase()}`}
                            className={`relative overflow-hidden group rounded-[2rem] p-8 سم:p-10 border bg-gradient-to-br ${genre.color} backdrop-blur-md transition-all duration-500 hover:-translate-y-2`}
                        >
                            <div className="absolute inset-0 bg-[#0a0a0a]/40 group-hover:bg-transparent transition-colors duration-500" />
                            <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
                                <Search className="w-10 h-10 mb-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                                <h2 className="text-2xl sm:text-3xl font-black">{genre.title}</h2>
                                <span className="text-sm font-bold opacity-70 mt-2 uppercase tracking-widest">{genre.name}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
