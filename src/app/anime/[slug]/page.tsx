'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Star, Calendar, Clock, User2, Play, Hexagon, Search, AlertCircle, ChevronRight, Share2, Loader2, History } from "lucide-react";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { useHistory } from '@/context/HistoryContext';

interface AnimeDetail {
  id: string; slug: string; title: string; image?: string; banner?: string; synopsis?: string;
  type?: string; status?: string; rating?: number; episodes?: number; year?: number; season?: string;
  duration?: string; genres?: string[]; studios?: string[]; trailer?: string;
  episodeList?: { id: string; number: number; title: string; isFiller: boolean; image?: string; }[];
}

// ── Interactive Episode Card ─────────────
function InteractiveEpisodeCard({ ep, baseImage, animeSlug, isWatched }: { ep: any, baseImage?: string, animeSlug: string, isWatched?: boolean }) {
  // Fallback to anime cover if episode image is missing
  const displayImage = ep.image || baseImage;

  return (
    <Link
      href={`/watch/${encodeURIComponent(ep.id)}`}
      className="group flex flex-col items-center gap-4 w-full cursor-pointer transition-transform duration-300 hover:-translate-y-2 relative"
    >
      {/* Large Circular Image Div */}
      <div className={`relative w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden shadow-lg border-4 transition-all duration-300 flex-shrink-0 ${ep.isFiller ? 'border-yellow-500/50 group-hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]' : 'border-white/10 group-hover:border-[#00F0FF]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]'} ${isWatched ? 'ring-4 ring-[#00F0FF] ring-offset-4 ring-offset-[#0a0a0a] shadow-[0_0_40px_rgba(0,240,255,0.5)]' : ''}`}>

        {/* Background Image */}
        {displayImage && (
          <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden bg-[#050505]">
            <Image src={displayImage} alt={`الحلقة ${ep.number}`} fill className={`object-cover transition-transform duration-700 group-hover:scale-110 ${ep.isFiller ? 'opacity-70' : 'opacity-100'}`} />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/10" />

        {/* Play Icon (Center - hidden until hover) */}
        <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#00F0FF]/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.6)]">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-1 translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Text Below the Div */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className={`font-black text-lg sm:text-xl transition-colors duration-300 ${ep.isFiller ? 'text-yellow-400' : 'text-gray-300 group-hover:text-white drop-shadow-md group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]'}`}>
          الحلقة {ep.number}
        </span>
        {ep.isFiller && (
          <span className="text-xs font-black text-yellow-400 bg-black/70 px-2.5 py-1 rounded-md border border-yellow-500/30">
            فلر
          </span>
        )}
        {isWatched && (
          <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-3 py-1 rounded-full border border-[#00F0FF]/30 flex items-center gap-1.5 mt-1">
            <History className="w-3 h-3" />
            توقفت هنا
          </span>
        )}
      </div>
    </Link>
  );
}

export default function AnimeDetailsPage() {
  const { slug } = useParams();
  const [data, setData] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [epSearch, setEpSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true); // Default: Latest first
  const [visibleEps, setVisibleEps] = useState(60); // Load in chunks of 60
  const { getHistory } = useHistory();

  useEffect(() => {
    fetch(`/api/anime?action=anime&slug=${encodeURIComponent(slug as string)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <motion.div animate={{ rotate: 180 }} transition={{ repeat: Infinity, duration: 1 }} className="w-16 h-16 border-t-2 border-r-2 border-white rounded-full shadow-sm" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      <AlertCircle className="w-16 h-16 text-gray-400 rounded-full" />
    </div>
  );

  const eps = data.episodeList || [];
  
  // Sort episodes based on toggle
  const sortedEps = [...eps].sort((a, b) => {
    return sortDesc ? b.number - a.number : a.number - b.number;
  });

  const filteredEps = epSearch ? sortedEps.filter(e => e.number.toString().includes(epSearch)) : sortedEps;

  const lastWatched = data.id ? getHistory(data.id) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-white/30" dir="rtl">
      <Header />

      {/* ── Banner ──────────────────────── */}
      <div className="relative h-[55vh] sm:h-[65vh] w-full overflow-hidden rounded-b-[4rem] sm:rounded-b-[5rem] border-b border-white/5">
        {data.banner || data.image ? (
          <Image src={data.banner || data.image!} alt={data.title} fill className="object-cover opacity-100" priority />
        ) : (
          <div className="absolute inset-0 bg-[#111]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

        <div className="absolute top-8 right-8 flex items-center gap-2 text-sm text-gray-400 z-10 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
          <Link href="/" className="hover:text-white transition-all font-bold">الرئيسية</Link>
          <ChevronRight className="w-4 h-4 text-white" />
          <span className="text-white font-medium">{data.title}</span>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-6xl -mt-40 sm:-mt-52 relative z-10 pb-20">

        {/* ── Details Card ───────────────────────── */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-[3rem] p-6 sm:p-10 flex flex-col sm:flex-row gap-8 sm:gap-12 relative overflow-hidden backdrop-blur-xl"
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        >
          {/* Poster */}
          <div className="relative w-48 sm:w-64 aspect-[3/4] mx-auto sm:mx-0 flex-shrink-0 group">
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/10 bg-black/50">
              {data.image && <Image src={data.image} alt={data.title} fill className="object-cover" />}
            </div>
            {/* Play Badge */}
            {eps.length > 0 && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <Link href={`/watch/${encodeURIComponent(lastWatched ? lastWatched.episodeId : eps[0].id)}`} className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform z-20 shadow-lg">
                  <Play className="w-6 h-6 fill-black ml-1" />
                </Link>
                {lastWatched && (
                  <div className="mt-3 whitespace-nowrap px-3 py-1 bg-black/80 border border-[#00F0FF]/30 text-[#00F0FF] text-[10px] font-bold rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                    <History className="w-3 h-3" />
                    متابعة الحلقة {lastWatched.episodeNumber}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data */}
          <div className="flex-1 min-w-0 z-10 flex flex-col justify-center">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {data.title}
              </h1>
              <FavoriteButton
                anime={{
                  id: data.id, slug: data.slug, title: data.title,
                  image: data.image || '', type: data.type, rating: data.rating
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-full p-2.5 sm:p-3 border border-white/10 hover:bg-white/10 shrink-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-white/10 text-white font-bold text-sm">
                {data.status === 'ONGOING' ? 'مستمر' : 'مكتمل'}
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-bold">
                {data.type || 'TV'}
              </span>
              {data.rating && (
                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 font-bold">
                  <Star className="w-4 h-4 fill-current" /> {data.rating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {data.year && (
                <div className="flex bg-white/5 p-3 rounded-2xl items-center gap-3 border border-white/5">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">{data.year}</span>
                </div>
              )}
              {data.duration && (
                <div className="flex bg-white/5 p-3 rounded-2xl items-center gap-3 border border-white/5">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">{data.duration}</span>
                </div>
              )}
              {data.studios && data.studios.length > 0 && (
                <div className="flex bg-white/5 p-3 rounded-2xl items-center gap-3 border border-white/5">
                  <User2 className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium line-clamp-1">{data.studios[0]}</span>
                </div>
              )}
            </div>

            {data.genres && data.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.genres.map(g => (
                  <span key={g} className="px-4 py-1.5 rounded-full text-xs font-bold text-gray-300 border border-white/10 hover:border-white hover:text-white hover:bg-white/10 transition-all cursor-default bg-black/40">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Synopsis ────────────────── */}
        {data.synopsis && (
          <motion.div
            className="mt-10 p-8 sm:p-10 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors duration-500"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            <h2 className="text-xl font-black mb-4 flex items-center gap-3 text-white">
              <Hexagon className="w-5 h-5 text-gray-400" /> القصة كاملة
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-lg font-medium tracking-wide">
              {data.synopsis}
            </p>
          </motion.div>
        )}

        {/* ── Episodes ─────────────────────────────── */}
        {eps.length > 0 ? (
          <div className="mt-12">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                  <h2 className="text-2xl font-black flex items-center gap-3 text-white">
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    الحلقات <span className="text-gray-500 text-lg">({eps.length})</span>
                  </h2>
                  <button onClick={() => { setSortDesc(!sortDesc); setVisibleEps(60); }} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-bold hover:bg-white/20 transition-colors mr-auto">
                      {sortDesc ? 'الأحدث أولاً ⬇' : 'الأقدم أولاً ⬆'}
                  </button>
              </div>
              {eps.length > 10 && (
                <div className="relative w-full sm:w-64">
                  <input
                    type="number" placeholder="بحث برقم الحلقة..." value={epSearch}
                    onChange={e => { setEpSearch(e.target.value); setVisibleEps(60); }}
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 px-4 justify-items-center">
              {filteredEps.slice(0, visibleEps).map((ep, idx) => (
                <InteractiveEpisodeCard key={`${ep.id}-${idx}`} ep={ep} baseImage={data.image} animeSlug={data.slug} isWatched={lastWatched?.episodeId === ep.id} />
              ))}
            </div>

            {filteredEps.length > visibleEps && (
                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => setVisibleEps(prev => prev + 60)}
                        className="px-12 py-4 bg-[#B026FF]/20 border border-[#B026FF]/50 text-[#B026FF] rounded-full font-bold text-lg hover:bg-[#B026FF] hover:text-white transition-all shadow-[0_0_20px_rgba(176,38,255,0.2)]"
                    >
                        عرض المزيد
                    </button>
                </div>
            )}

            {filteredEps.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/10">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">لا توجد حلقة بهذا الرقم</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-12 text-center py-20 bg-white/5 rounded-[3rem] border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">الحلقات غير متوفرة بعد</h3>
            <p className="text-gray-400 text-lg font-medium">هذا الأنمي أو الفيلم لم يرفع بعد أو قيد الترجمة والرفع...</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
