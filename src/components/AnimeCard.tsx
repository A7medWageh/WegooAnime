import Link from 'next/link';
import Image from 'next/image';
import { Star, Tv, Play } from 'lucide-react';

export function AnimeCard({ anime }: { anime: any }) {
    return (
        <Link href={`/anime/${anime.slug}`} className="group relative rounded-[2rem] overflow-hidden bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-all duration-500 aspect-[3/4] block hover:-translate-y-2">
            {anime.image ? (
                <Image src={anime.image} alt={anime.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:blur-[2px]" sizes="(max-width: 768px) 50vw, 25vw" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#111]">
                    <Tv className="w-10 h-10 text-white/20" />
                </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500" />

            {/* Centered Play Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                <div className="w-16 h-16 rounded-full bg-indigo-500/80 border border-indigo-400/60 flex items-center justify-center scale-50 group-hover:scale-100 transition-transform duration-500 ease-out shadow-lg">
                    <Play className="w-7 h-7 text-white fill-white ml-1 translate-x-0.5" />
                </div>
            </div>

            {/* Info Bottom */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 z-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-sm font-bold text-center line-clamp-2 text-white group-hover:text-indigo-200 transition-colors mb-2">
                    {anime.title || 'بدون اسم'}
                </h3>
                <div className="flex justify-between items-center text-[10px] font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="bg-indigo-500/80 text-white border border-indigo-500/30 px-2 py-1 rounded-full">
                        {anime.type || anime.animeType || 'TV'}
                    </span>
                    {anime.rating ? (
                        <span className="flex items-center gap-1 bg-black/80 px-2.5 py-1 rounded-full border border-white/10 text-white">
                            <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                            {typeof anime.rating === 'number' ? anime.rating.toFixed(1) : anime.rating}
                        </span>
                    ) : (
                        <span />
                    )}
                </div>
            </div>
        </Link>
    );
}
