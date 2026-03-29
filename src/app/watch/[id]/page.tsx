'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  X, ChevronRight, ChevronLeft, AlertCircle,
  Tv, Zap, Heart, Share2, Info, CheckCircle2, Settings, Download, Film, Play, Pause, Loader2
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { CustomPlayer } from '@/components/player/CustomPlayer';

const MobilePlayer = dynamic(() => import('@/components/player/MobilePlayer').then(mod => mod.MobilePlayer), { ssr: false });

import { useHistory } from '@/context/HistoryContext';
import { useFavorites } from '@/context/FavoritesContext';

interface EpisodeType { id: string; number: number; title: string; }
interface Source { quality: string; serverId: string; }
interface EpisodeData {
  id: string; number: number; title: string;
  anime: { id: string; title: string; slug: string; image?: string; mal_id?: string | number | null; };
  episodes: EpisodeType[];
  availableSources: Source[];
  hasDirectLinks: boolean;
}

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const episodeId = Array.isArray(id) ? id.join('/') : (id as string);
  const { updateHistory, getHistory } = useHistory();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkIsTouch = () => (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    const isTouch = checkIsTouch();
    const mq = window.matchMedia('(max-width: 1024px)');
    
    // Evaluate once on mount. Never hot-swap the video player on resize/orientation change to prevent video reload/destruction!
    setIsMobile(isTouch || mq.matches);
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EpisodeData | null>(null);

  const [selectedQuality, setSelectedQuality] = useState<Source | null>(null);
  const [resolving, setResolving] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadQuality, setDownloadQuality] = useState('اختر الجودة');
  const [isDownloadPaused, setIsDownloadPaused] = useState(false);
  const [downloadErrorMsg, setDownloadErrorMsg] = useState<string | null>(null);
  const [downloadErrorUrl, setDownloadErrorUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);

  const fetchEpisode = useCallback(async (epId: string) => {
    setLoading(true); setError(null);
    setVideoUrl(null); setSelectedQuality(null); setVideoError(false);
    try {
      const res = await fetch(`/api/anime?action=episode&id=${encodeURIComponent(epId)}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Start time will be handled in a separate effect once data is ready
        const best = json.data.availableSources?.find((s: Source) => s.quality === '1080p')
          || json.data.availableSources?.find((s: Source) => s.quality === '720p')
          || json.data.availableSources?.[0] || null;
        if (best) selectQuality(best);
      } else { setError(json.error || 'فقد الاتصال بالمحطة'); }
    } catch { setError('تشويش في الإشارة'); }
    finally { setLoading(false); }
  }, []); // Stable fetcher

  const selectQuality = useCallback(async (src: Source) => {
    setSelectedQuality(src); setVideoUrl(null); setVideoError(false);
    setResolving(true);
    try {
      const res = await fetch(`/api/anime?action=stream&id=${encodeURIComponent(src.serverId)}`);
      const json = await res.json();
      if (json.success && json.url) {
        setVideoUrl(json.url);
      } else { setVideoError(true); }
    } catch { setVideoError(true); }
    finally { setResolving(false); }
  }, []);

  useEffect(() => { if (episodeId) fetchEpisode(episodeId); }, [episodeId, fetchEpisode]);

  // Handle History and Resume Playback (Decoupled to prevent loops)
  useEffect(() => {
    if (data && episodeId) {
      const h = getHistory(data.anime.id);
      if (h && h.episodeId === episodeId && h.watchedSeconds) {
        setStartTime(h.watchedSeconds);
      } else {
        setStartTime(0);
      }
      updateHistory(data.anime.id, episodeId, data.number.toString(), h?.watchedSeconds || 0);
    }
  }, [data?.id, episodeId]); // Only run when episode or basic data ID changes

  const navigate = useCallback((dir: 'prev' | 'next') => {
    if (!data?.episodes?.length || !data.id) return;
    const idx = data.episodes.findIndex(e => e.id === data.id);
    const next = dir === 'next' ? idx + 1 : idx - 1;
    if (next >= 0 && next < data.episodes.length)
      router.push(`/watch/${encodeURIComponent(data.episodes[next].id)}`);
  }, [data, router]);

  const handleDownload = async (serverIdOrUrl: string, qualityLabel: string) => {
    if (!serverIdOrUrl) return;
    setDownloadErrorMsg(null);
    setDownloadErrorUrl(null);
    setDownloadQuality(qualityLabel);
    setIsDownloading(true);
    setDownloadProgress(0);
    setIsDownloadPaused(false);
    isPausedRef.current = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Resolve the actual video url
      let finalUrl = serverIdOrUrl;
      // If it's a server ID, fetch the raw stream URL from our API
      if (!serverIdOrUrl.startsWith('http') && !serverIdOrUrl.includes('/api/')) {
         const res = await fetch(`/api/anime?action=stream&id=${encodeURIComponent(serverIdOrUrl)}`).then(x => x.json());
         if (res.success && res.url) finalUrl = res.url;
         else throw new Error("Failed to resolve stream URL from server ID");
      } else if (serverIdOrUrl.includes('/api/') || serverIdOrUrl.includes('aniwatch')) {
        const r = await fetch(serverIdOrUrl).then(x => x.json());
        if (r.url) finalUrl = r.url;
        else if (r.sources && r.sources.length>0) finalUrl = r.sources[0].url;
      }
      
      // Now fetch the actual stream blob
      const response = await fetch(finalUrl, { signal: controller.signal });
      if (!response.ok) throw new Error('Download failed');
      const reader = response.body?.getReader();
      const contentLength = +(response.headers.get('Content-Length') || 0);
      let receivedLength = 0;
      const chunks: any[] = [];
      let lastUIUpdate = 0;
      
      while(true) {
        if (isPausedRef.current) {
          await new Promise(r => setTimeout(r, 100));
          continue;
        }
        const {done, value} = await reader!.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        const now = performance.now();
        if (contentLength && now - lastUIUpdate > 200) {
          setDownloadProgress(Math.round((receivedLength / contentLength) * 100));
          lastUIUpdate = now;
        }
      }
      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.anime.title} - الحلقة ${data?.number} - ${qualityLabel}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
         // Resolve the fallback url safely for the external button
         let fallback = serverIdOrUrl;
         if (!serverIdOrUrl.startsWith('http') && !serverIdOrUrl.includes('/api/')) {
             try {
                 const res = await fetch(`/api/anime?action=stream&id=${encodeURIComponent(serverIdOrUrl)}`).then(x => x.json());
                 if (res.url) fallback = res.url;
             } catch(e) {}
         } else if (serverIdOrUrl.includes('/api/')) {
             try {
                 const r = await fetch(serverIdOrUrl).then(x => x.json());
                 fallback = r.url || r.sources?.[0]?.url || serverIdOrUrl;
             } catch(e) {}
         }
         setDownloadErrorMsg("حماية الخادم تمنع التنزيل المباشر كملف داخلي.");
         setDownloadErrorUrl(fallback);
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setIsDownloadPaused(false);
    }
  };

  const cancelDownload = () => abortControllerRef.current?.abort();
  const togglePauseDownload = () => {
    isPausedRef.current = !isPausedRef.current;
    setIsDownloadPaused(isPausedRef.current);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#030014]">
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="w-24 h-24 rounded-full border border-[#00F0FF] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)]">
        <Zap className="w-8 h-8 text-[#00F0FF] animate-pulse" />
      </motion.div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col bg-[#030014] text-white">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-12 glass-panel rounded-[3rem]">
          <AlertCircle className="w-16 h-16 text-pink-500 mx-auto mb-6 shadow-[0_0_20px_rgba(236,72,153,0.5)] rounded-full animate-bounce" />
          <p className="text-xl font-bold text-gray-300 mb-6">{error || 'فقدنا إشارة البث'}</p>
          <Link href="/" className="px-8 py-3 bg-[#B026FF]/20 border border-[#B026FF]/50 text-[#B026FF] rounded-full font-bold shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:bg-[#B026FF] hover:text-white transition-all">العودة للمركز</Link>
        </div>
      </main>
    </div>
  );

  return (
    <div className={`flex flex-col transition-colors duration-700 ${theaterMode ? 'bg-[#000000]' : 'bg-[#030014]'} text-white selection:bg-[#00F0FF]/30`}>
      <Header />
      <main className="flex-1 py-8 px-0 sm:px-8 mt-16 font-sans">
        <div className={`mx-auto transition-all duration-700 w-full min-w-0 ${theaterMode ? 'max-w-none px-0 -mt-16 relative z-50' : 'max-w-[1600px] container'}`}>
          <div className={`grid gap-6 items-start w-full min-w-0 ${theaterMode ? 'grid-cols-1' : 'lg:grid-cols-4 xl:grid-cols-5'}`}>
            <div className={`${theaterMode ? 'w-full max-w-7xl mx-auto h-screen flex flex-col' : 'lg:col-span-3 xl:col-span-4'} flex flex-col min-w-0`}>
              <div className={`relative w-full bg-[#05001A] overflow-hidden ${theaterMode ? 'flex-1' : 'aspect-video rounded-none sm:rounded-[3rem] border border-[#00F0FF]/20 shadow-2xl'}`}>
                <AnimatePresence>
                  {(resolving || (!videoUrl && !videoError)) && (
                    <motion.div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#00F0FF] to-[#B026FF] flex items-center justify-center animate-pulse">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-xl font-black text-white mt-6 uppercase tracking-widest">{resolving ? 'RESOLVING SIGNAL' : 'INITIALIZING'}</p>
                    </motion.div>
                  )}
                  {videoError && (
                    <motion.div className="absolute inset-0 z-20 bg-red-900/40 backdrop-blur-md flex flex-col items-center justify-center">
                      <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
                      <p className="text-xl font-black mb-6">SIGNAL INTERCEPTED</p>
                      <button onClick={() => fetchEpisode(episodeId)} className="px-8 py-3 bg-red-500 rounded-full font-bold">RETRY CONNECTION</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {videoUrl && isMobile !== null && (
                  isMobile ? (
                    <MobilePlayer
                      videoUrl={videoUrl}
                      poster={data.anime.image}
                      title={data.anime.title}
                      subtitle={`EP ${data.number}`}
                      startTime={startTime}
                      malId={data.anime.mal_id}
                      episodeNumber={data.number}
                      onTimeUpdate={(time) => updateHistory(data.anime.id, episodeId, data.number.toString(), time)}
                      onVideoEnd={() => navigate('next')}
                      manualQualities={data.availableSources}
                      onQualityChange={(serverId) => {
                        const src = data.availableSources.find(s => s.serverId === serverId);
                        if (src) selectQuality(src);
                      }}
                      currentManualQuality={selectedQuality?.quality}
                    />
                  ) : (
                    <CustomPlayer
                      videoUrl={videoUrl}
                      poster={data.anime.image}
                      title={data.anime.title}
                      subtitle={`EP ${data.number}`}
                      startTime={startTime}
                      malId={data.anime.mal_id}
                      episodeNumber={data.number}
                      onTimeUpdate={(time) => updateHistory(data.anime.id, episodeId, data.number.toString(), time)}
                      onVideoEnd={() => navigate('next')}
                      manualQualities={data.availableSources}
                      onQualityChange={(serverId) => {
                        const src = data.availableSources.find(s => s.serverId === serverId);
                        if (src) selectQuality(src);
                      }}
                      currentManualQuality={selectedQuality?.quality}
                    />
                  )
                )}
                {videoUrl && isMobile === null && (
                  <div className="w-full h-full aspect-video flex items-center justify-center bg-[#05001A]">
                    <Loader2 className="w-12 h-12 text-[#00F0FF] animate-spin drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
                  </div>
                )}
              </div>

              {!theaterMode && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:px-10 mt-6 rounded-[2.5rem] glass-card border border-white/10 relative overflow-hidden">
                  <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                    <button onClick={() => navigate('prev')} disabled={data.episodes.findIndex(e => e.id === data.id) <= 0}
                      className="flex-1 sm:flex-none flex justify-center items-center gap-3 px-6 py-3 rounded-full text-sm font-bold bg-white/5 border border-white/10 hover:border-white/30 disabled:opacity-30 transition-all">
                      <ChevronRight className="w-4 h-4" /> العودة
                    </button>
                    <button onClick={() => navigate('next')} disabled={data.episodes.findIndex(e => e.id === data.id) >= data.episodes.length - 1}
                      className="flex-1 sm:flex-none flex justify-center items-center gap-3 px-8 py-3 rounded-full text-sm font-black bg-[#00F0FF] text-[#030014] shadow-lg disabled:opacity-30 transition-all">
                      تقدم الإقلاع <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Redundant controls hidden on mobile */}
                  <div className="hidden sm:flex items-center gap-3 relative z-10">
                    <Settings className="w-5 h-5 text-[#00F0FF] animate-spin-slow" />
                    {data.availableSources.map((s, i) => (
                      <button key={i} onClick={() => selectQuality(s)} disabled={resolving}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${selectedQuality?.quality === s.quality ? 'bg-[#B026FF]/20 border border-[#B026FF] text-[#B026FF]' : 'bg-white/5 border border-white/10 hover:border-white/30 text-white/60'}`}>
                        {s.quality}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`${theaterMode ? 'hidden' : 'lg:col-span-1 xl:col-span-1'} flex flex-col gap-6 mx-4 sm:mx-0 min-w-0 w-full max-w-full`}>
              <div className="p-6 rounded-[2.5rem] glass-card border border-white/10 flex flex-col items-center gap-6 relative overflow-hidden group min-w-0 w-full">
                <div className="absolute -right-20 -top-20 w-48 h-48 bg-[#00F0FF]/10 blur-[60px] rounded-full group-hover:bg-[#B026FF]/10 transition-all duration-700" />
                <div className="relative w-40 h-56 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40 flex items-center justify-center shrink-0">
                  <img src={data.anime.image?.includes('data:image') ? '/logo.png' : (data.anime.image || '/logo.png')} onError={(e) => { if (!e.currentTarget.src.includes('logo.png')) e.currentTarget.src = '/logo.png'; }} alt={data.anime.title} className={`w-full h-full transition-transform duration-700 group-hover:scale-110 ${(data.anime.image?.includes('data:image') || !data.anime.image) ? 'object-contain p-6 opacity-30' : 'object-cover'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
                <div className="text-center w-full min-w-0 max-w-full">
                  <h3 className="font-black text-xl mb-4 line-clamp-2 break-all break-words overflow-wrap-normal whitespace-normal">{data.anime.title}</h3>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    <button onClick={() => isFavorite(data.anime.slug) ? removeFavorite(data.anime.slug) : addFavorite({ id: data.anime.id, slug: data.anime.slug, title: data.anime.title, image: data.anime.image || '' })}
                      className={`p-3 rounded-full border transition-all ${isFavorite(data.anime.slug) ? 'bg-[#B026FF]/20 border-[#B026FF] text-[#B026FF]' : 'bg-white/5 border-white/10'}`}>
                      <Heart className={`w-5 h-5 ${isFavorite(data.anime.slug) ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className={`p-3 rounded-full border transition-all ${copied ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10'}`}>
                      {copied ? <CheckCircle2 className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    </button>
                    <Link href={`/anime/${data.anime.slug}`} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-black hover:bg-white/10 transition-all">البيانات</Link>
                  </div>
                </div>

                <div className="w-full bg-[#030014]/60 p-6 rounded-[2rem] border border-white/5 min-w-0 overflow-hidden">
                  <div className="flex flex-col mb-4 min-w-0">
                    <span className="text-sm font-black text-white/60 mb-1">تحميل الحلقة</span>
                    <span className="text-xs font-black text-[#00F0FF] uppercase">اختر الجودة المطلوبة</span>
                  </div>
                  
                  {downloadErrorMsg ? (
                    <div className="flex flex-col gap-3 mt-4">
                      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-between">
                         <span className="text-[10px] font-bold text-red-500">{downloadErrorMsg}</span>
                         <button onClick={() => setDownloadErrorMsg(null)} className="p-1 text-red-500 hover:text-white"><X className="w-4 h-4"/></button>
                      </div>
                      <a href={downloadErrorUrl!} target="_blank" className="py-3 px-4 rounded-xl bg-[#B026FF]/20 text-xs font-black text-white border border-[#B026FF]/30 text-center flex items-center justify-center gap-2 hover:bg-[#B026FF]/40 transition-all">
                        <Download className="w-4 h-4"/> تحميل عبر السيرفر الخارجي (كليك يمين + Save)
                      </a>
                    </div>
                  ) : isDownloading ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center text-white">
                        <span className="text-xs font-black tracking-wide">جاري التنزيل... {downloadProgress}%</span>
                        <div className="flex gap-2">
                          <button onClick={togglePauseDownload} className="p-2 rounded-lg bg-white/10 text-white hover:text-[#00F0FF] transition-all">{isDownloadPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}</button>
                          <button onClick={cancelDownload} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${downloadProgress}%` }} className="h-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF] shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                      </div>
                      <div className="flex justify-between items-end gap-2 mt-2">
                        <span className="text-[10px] bg-[#00F0FF]/10 text-[#00F0FF] px-3 py-1 rounded-full font-black border border-[#00F0FF]/20">{downloadQuality}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {data?.availableSources?.length ? data.availableSources.map((src: any) => (
                        <button key={src.serverId + src.quality} onClick={() => handleDownload(src.serverId, src.quality)} className="py-2.5 px-2 rounded-xl bg-white/5 text-xs font-black hover:bg-[#00F0FF]/10 hover:text-[#00F0FF] border border-white/5 hover:border-[#00F0FF]/30 transition-all text-white flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <Download className="w-4 h-4 flex-shrink-0" /> {src.quality}
                        </button>
                      )) : (
                        <button onClick={() => handleDownload(videoUrl!, 'تلقائي')} className="col-span-2 py-3 rounded-xl bg-[#B026FF]/20 text-sm font-black hover:bg-[#B026FF]/30 text-white border border-[#B026FF]/40 transition-all flex items-center justify-center gap-2">
                          <Download className="w-5 h-5" /> تحميل الحلقة
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2.5rem] glass-card border border-white/10 overflow-hidden flex flex-col h-fit max-h-[500px] min-w-0 w-full">
                <div className="p-6 bg-white/5 border-b border-white/5 flex items-center gap-3">
                  <Film className="w-5 h-5 text-[#00F0FF]" />
                  <h3 className="font-black text-lg">عقد المسار <span className="text-white/40 text-sm">({data.episodes.length})</span></h3>
                </div>
                <div className="p-4 overflow-y-auto scrollbar-hide">
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {[...data.episodes].reverse().map((ep) => (
                      <Link key={ep.id} href={`/watch/${encodeURIComponent(ep.id)}`} className={`aspect-square flex items-center justify-center rounded-full text-xs font-black transition-all ${ep.id === episodeId ? 'bg-gradient-to-br from-[#00F0FF] to-[#B026FF] text-white shadow-lg scale-110' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                        {ep.number}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
