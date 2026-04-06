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
  const [showSkipNotice, setShowSkipNotice] = useState(false);

  useEffect(() => {
    // Show warning overlay at the start of every episode
    setShowSkipNotice(true);
  }, [episodeId]);

  const dismissSkipNotice = () => {
    setShowSkipNotice(false);
  };
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeedMBps, setDownloadSpeedMBps] = useState(0);
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
        
        if (best) {
           selectQuality(best);
        } else {
           setVideoError(true);
           setError('نعتذر، سيرفرات المشاهدة لهذه الحلقة غير متوفرة حالياً.');
           setResolving(false);
        }
      } else { setError(json.error || 'فقد الاتصال بالمحطة'); }
    } catch { setError('تشويش في الإشارة'); }
    finally { setLoading(false); }
  }, []); // Stable fetcher

  const selectQuality = useCallback(async (src: Source) => {
    setSelectedQuality(src); setVideoUrl(null); setVideoError(false);
    setResolving(true);
    try {
      // Add timeout for faster fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const res = await fetch(`/api/anime?action=stream&id=${encodeURIComponent(src.serverId)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const json = await res.json();
      if (json.success && json.url) {
        setVideoUrl(json.url);
      } else { 
        // Try alternative servers if primary fails
        if (data?.availableSources && data.availableSources.length > 1) {
          const alternatives = data.availableSources.filter(s => s.serverId !== src.serverId);
          for (const alt of alternatives.slice(0, 3)) { // Try up to 3 alternatives
            try {
              const altController = new AbortController();
              const altTimeout = setTimeout(() => altController.abort(), 3000);
              
              const altRes = await fetch(`/api/anime?action=stream&id=${encodeURIComponent(alt.serverId)}`, {
                signal: altController.signal
              });
              clearTimeout(altTimeout);
              
              const altJson = await altRes.json();
              if (altJson.success && altJson.url) {
                setVideoUrl(altJson.url);
                setSelectedQuality(alt);
                return;
              }
            } catch (altErr) {
              console.log(`Alternative server ${alt.serverId} failed:`, altErr);
              continue;
            }
          }
        }
        setVideoError(true); 
      }
    } catch (err) {
      console.error('Stream fetch error:', err);
      setVideoError(true);
    }
    finally { 
      setResolving(false); 
    }
  }, [data?.availableSources]);

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
    console.log('Download clicked with:', { serverIdOrUrl, qualityLabel });
    
    if (!serverIdOrUrl) {
      console.error('No server ID or URL provided');
      return;
    }
    
    setDownloadErrorMsg(null);
    setDownloadErrorUrl(null);
    setDownloadQuality(qualityLabel);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadSpeedMBps(0);
    setIsDownloadPaused(false);
    isPausedRef.current = false;
    
    // Create new abort controller for this download
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let preflightProgressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      // Resolve the actual video url
      let finalUrl = serverIdOrUrl;
      console.log('Resolving URL...');
      
      // If it's a server ID, fetch the raw stream URL from our API
      if (!serverIdOrUrl.startsWith('http') && !serverIdOrUrl.includes('/api/')) {
         console.log('Fetching stream URL for server ID:', serverIdOrUrl);
         const res = await fetch(`/api/anime?action=stream&id=${encodeURIComponent(serverIdOrUrl)}`);
         const json = await res.json();
         console.log('Stream API response:', json);
         
         if (json.success && json.url) {
           finalUrl = json.url;
         } else {
           throw new Error("Failed to resolve stream URL from server ID");
         }
      } else if (serverIdOrUrl.includes('/api/') || serverIdOrUrl.includes('aniwatch')) {
        console.log('Processing API URL:', serverIdOrUrl);
        const r = await fetch(serverIdOrUrl).then(x => x.json());
        if (r.url) finalUrl = r.url;
        else if (r.sources && r.sources.length>0) finalUrl = r.sources[0].url;
      }
      
      console.log('Final download URL:', finalUrl);
      
      if (!finalUrl) {
        throw new Error('No valid download URL found');
      }

      // Download through our internal proxy so progress stays inside the site UI.
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(finalUrl)}&filename=${encodeURIComponent(`${data?.anime.title} - الحلقة ${data?.number} - ${qualityLabel}.mp4`)}`;
      console.log('Proxy URL:', proxyUrl);

      const response = await fetch(proxyUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/octet-stream, video/mp4, */*',
        }
      });
      
      console.log('Proxy response status:', response.status);
      
      if (!response.ok) {
        console.error('Proxy response error:', response.status, response.statusText);
        // Don't try to read the error text if it's a large response
        try {
          const errorText = await response.text();
          // Limit error text to prevent memory issues
          const limitedErrorText = errorText.length > 1000 ? errorText.substring(0, 1000) + '...' : errorText;
          console.error('Error details:', limitedErrorText);
        } catch (e) {
          console.error('Could not read error response');
        }
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }
      
      const contentLengthHeader = response.headers.get('Content-Length');
      const proxyFileSizeHeader = response.headers.get('X-File-Size');
      const contentRangeHeader = response.headers.get('Content-Range');
      const parsedContentLength = +(contentLengthHeader || 0);
      const parsedProxyFileSize = +(proxyFileSizeHeader || 0);
      const parsedContentRangeLength = contentRangeHeader?.match(/\/(\d+)$/)?.[1];
      const contentLength = parsedContentLength || parsedProxyFileSize || +(parsedContentRangeLength || 0);
      console.log('Content length:', contentLength, 'Content-Range:', contentRangeHeader);
      
      let receivedLength = 0;
      const chunks: Uint8Array[] = [];
      let lastUIUpdate = 0;
      let lastProgressValue = -1;
      let firstChunkReceived = false;
      let lastChunkAt = Date.now();
      let lastSpeedSampleAt = performance.now();
      let bytesSinceLastSample = 0;
      const suggestedFileName = `${data?.anime.title} - الحلقة ${data?.number} - ${qualityLabel}.mp4`;
      const supportsFileSystemAccess = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
      let writableStream: FileSystemWritableFileStream | null = null;
      if (supportsFileSystemAccess) {
        try {
          const pickerHandle = await (window as any).showSaveFilePicker({
            suggestedName: suggestedFileName,
            types: [{ description: 'Video File', accept: { 'video/mp4': ['.mp4'] } }]
          });
          writableStream = await pickerHandle.createWritable();
        } catch (pickerError) {
          console.log('Save picker not granted, falling back to in-memory blob flow');
        }
      }
      if (contentLength === 0) {
        preflightProgressInterval = setInterval(() => {
          setDownloadProgress(prev => (prev < 15 ? prev + 1 : prev));
        }, 700);
      }
      
      while(true) {
        // Check if download was cancelled before attempting to read
        if (controller.signal.aborted) {
          console.log('Download was cancelled - stopping read loop');
          try {
            reader.cancel(); // Cancel the reader to prevent further reads
          } catch (e) {
            console.log('Reader already cancelled');
          }
          // Exit gracefully without throwing error
          return;
        }
        
        if (isPausedRef.current) {
          await new Promise(r => setTimeout(r, 100));
          continue;
        }
        
        if (Date.now() - lastChunkAt > 45000) {
          throw new Error('Download stream timed out with no incoming data');
        }

        let done, value;
        try {
          ({done, value} = await reader.read());
        } catch (readError) {
          if (controller.signal.aborted) {
            console.log('Read aborted due to cancellation');
            // Don't throw error for cancellation, just exit gracefully
            return;
          }
          throw readError;
        }
        
        if (done) break;
        
        if (!firstChunkReceived && preflightProgressInterval) {
          clearInterval(preflightProgressInterval);
          preflightProgressInterval = null;
        }
        firstChunkReceived = true;
        lastChunkAt = Date.now();
        if (writableStream) {
          await writableStream.write(value);
        } else {
          chunks.push(value);
        }
        receivedLength += value.length;
        bytesSinceLastSample += value.length;
        
        const now = performance.now();
        if (now - lastUIUpdate > 500) {
          if (contentLength > 0) {
            const progress = Math.min(99, Math.round((receivedLength / contentLength) * 100));
            if (progress !== lastProgressValue) {
              setDownloadProgress(progress);
              lastProgressValue = progress;
            }
          } else {
            // Fallback when the upstream server does not expose total size.
            setDownloadProgress(prev => {
              const nextValue = Math.min(prev + 1, 95);
              lastProgressValue = nextValue;
              return nextValue;
            });
          }
          lastUIUpdate = now;
        }

        if (now - lastSpeedSampleAt >= 1000) {
          const elapsedSeconds = (now - lastSpeedSampleAt) / 1000;
          const speed = bytesSinceLastSample / elapsedSeconds / (1024 * 1024);
          setDownloadSpeedMBps(Number.isFinite(speed) ? +speed.toFixed(2) : 0);
          bytesSinceLastSample = 0;
          lastSpeedSampleAt = now;
        }

      }

      if (!firstChunkReceived || receivedLength === 0) {
        throw new Error('No downloadable video data was received from source');
      }
      
      console.log('Creating blob and triggering download...');
      setDownloadProgress(100);
      
      if (writableStream) {
        await writableStream.close();
      } else {
        // Check if we have any data before creating blob
        if (chunks.length === 0) {
          throw new Error('No data received for download');
        }
        
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        
        if (totalSize < 100000) { // Less than 100KB
          throw new Error('Downloaded file is too small to be a valid video');
        }
        
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data?.anime.title} - الحلقة ${data?.number} - ${qualityLabel}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      console.log('Download completed successfully');
      
    } catch (err: any) {
      if (preflightProgressInterval) {
        clearInterval(preflightProgressInterval);
        preflightProgressInterval = null;
      }
      // Early return for cancellation errors to avoid unnecessary logging
      if (err.message === 'Download cancelled' || 
          err.name === 'AbortError' || 
          (err.constructor?.name === 'DOMException' && err.code === 20) ||
          (err.constructor?.name === 'DOMException' && err.message?.includes('aborted'))) {
        console.log('Download cancelled by user');
        return;
      }
      
      console.error('Download error:', err);
      console.error('Error type:', typeof err);
      console.error('Error constructor:', err?.constructor?.name);
      console.error('Error stack:', err?.stack || 'No stack available');
      console.error('Error details:', {
        message: err?.message || 'No message',
        name: err?.name || 'No name',
        cause: err?.cause || 'No cause',
        code: err?.code || 'No code',
        status: err?.status || 'No status',
        statusCode: err?.statusCode || 'No statusCode'
      });
      
      // Try to stringify the error safely
      try {
        const errorString = JSON.stringify(err, null, 2);
        console.error('Error as JSON:', errorString);
      } catch (e) {
        console.error('Could not stringify error:', e);
      }
      
      // Don't show error for early returns (graceful cancellation)
      if (!err.message && !err.name) {
        console.log('Download ended gracefully');
        return;
      }
      
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
         setDownloadErrorMsg("فشل التحميل عبر الخادم الداخلي. يمكنك استخدام الرابط الخارجي.");
         setDownloadErrorUrl(fallback);
      }
    } finally {
      if (preflightProgressInterval) {
        clearInterval(preflightProgressInterval);
      }
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadSpeedMBps(0);
      setIsDownloadPaused(false);
      abortControllerRef.current = null;
    }
  };

  const cancelDownload = () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    } catch (error) {
      console.log('Download already cancelled or completed');
    }
    // Reset states immediately without waiting for error handling
    setIsDownloading(false);
    setDownloadProgress(0);
    setDownloadSpeedMBps(0);
    setIsDownloadPaused(false);
    isPausedRef.current = false;
  };
  const togglePauseDownload = () => {
    isPausedRef.current = !isPausedRef.current;
    setIsDownloadPaused(isPausedRef.current);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030014] gap-10 px-6" dir="rtl">
      {/* Spinner */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-24 h-24 rounded-full border border-[#00F0FF] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)]"
      >
        <Zap className="w-8 h-8 text-[#00F0FF] animate-pulse" />
      </motion.div>

      <p className="text-white/40 text-sm font-bold tracking-widest uppercase">جاري تحميل الحلقة...</p>

      {/* Skip Intro Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="w-full max-w-lg bg-[#B026FF]/5 border border-[#B026FF]/25 rounded-3xl p-6 flex flex-col gap-4 shadow-[0_0_40px_rgba(176,38,255,0.15)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#B026FF]/20 border border-[#B026FF]/40 flex items-center justify-center shrink-0">
            <span className="text-[#B026FF] text-base font-black">!</span>
          </div>
          <span className="text-[#B026FF] font-black text-base tracking-wide">ملاحظة مجتمعية مهمة</span>
        </div>
        <p className="text-white/60 text-sm leading-7 font-bold">
          زرار <span className="text-white font-black">"تخطي الانترو"</span> الموجود في المشغل{' '}
          <span className="text-[#00F0FF]">يُعلّم نظامنا الذكي بوقت الانترو</span> تلقائياً ويُساعد كل المشاهدين القادمين.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2 text-xs text-white/40 font-bold">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>اضغطه <span className="text-white/70">عند بداية موسيقى الانترو فقط</span></span>
          </div>
          <div className="flex items-start gap-2 text-xs text-white/40 font-bold">
            <span className="text-red-400 mt-0.5">✗</span>
            <span>لا تضغطه في أي وقت عشوائي — سيُفسد التوقيت للجميع</span>
          </div>
        </div>
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
                      <p className="text-xl font-black text-white mt-6 uppercase tracking-widest">{resolving ? 'جاري جلب الرابط...' : 'جاري التشغيل...'}</p>
                    </motion.div>
                  )}
                  {videoError && !error && (
                    <motion.div className="absolute inset-0 z-20 bg-red-900/40 backdrop-blur-md flex flex-col items-center justify-center">
                      <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
                      <p className="text-xl font-black mb-6 uppercase">السيرفر لا يستجيب</p>
                      <button onClick={() => fetchEpisode(episodeId)} className="px-8 py-3 bg-red-500 hover:bg-red-600 rounded-full font-bold shadow-lg transition-all">إعادة المحاولة</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {videoUrl && isMobile !== null && (
                  <AnimatePresence>
                    {showSkipNotice && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
                        dir="rtl"
                      >
                        <motion.div
                          initial={{ scale: 0.85, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          className="w-full max-w-[340px] bg-[#05001A] border border-[#B026FF]/30 rounded-3xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-5 shadow-[0_0_60px_rgba(176,38,255,0.3)]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#B026FF]/20 border border-[#B026FF]/40 flex items-center justify-center">
                                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B026FF]" />
                              </div>
                              <span className="text-[#B026FF] font-black text-xs sm:text-sm tracking-wide">ملاحظة مجتمعية</span>
                            </div>
                            <button onClick={dismissSkipNotice} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>

                          <p className="text-white/70 text-xs sm:text-sm leading-6 sm:leading-7 font-bold">
                            زرار <span className="text-white font-black">"تخطي الانترو"</span> في المشغل{' '}
                            <span className="text-[#00F0FF]">يُعلّم نظامنا</span> بوقت الانترو ويُساعد الجميع تلقائياً.
                          </p>

                          <div className="flex flex-col gap-2 sm:gap-2.5">
                            <div className="flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-xs font-bold">
                              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500/15 flex items-center justify-center shrink-0"><span className="text-green-400 text-[8px] sm:text-[10px]">✓</span></span>
                              <span className="text-white/60">اضغطه <span className="text-white/90">عند بداية موسيقى الانترو فقط</span></span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-xs font-bold">
                              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500/15 flex items-center justify-center shrink-0"><span className="text-red-400 text-[8px] sm:text-[10px]">✗</span></span>
                              <span className="text-white/60">لا تضغطه في وقت عشوائي</span>
                            </div>
                          </div>

                          <button
                            onClick={dismissSkipNotice}
                            className="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#B026FF] to-[#7B00FF] text-white font-black text-xs sm:text-sm hover:opacity-90 transition-all shadow-[0_0_20px_rgba(176,38,255,0.4)]"
                          >
                            فهمت! ابدأ المشاهدة 🎬
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {videoUrl && isMobile !== null && (
                  isMobile ? (
                    <MobilePlayer
                      videoUrl={videoUrl}
                      poster={data.anime.image}
                      title={data.anime.title}
                      subtitle={`EP ${data.number}`}
                      startTime={startTime}
                      malId={data.anime.mal_id || data.anime.slug}
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
                      malId={data.anime.mal_id || data.anime.slug}
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
                      <ChevronRight className="w-4 h-4" /> الحلقة السابقة
                    </button>
                    <button onClick={() => navigate('next')} disabled={data.episodes.findIndex(e => e.id === data.id) >= data.episodes.length - 1}
                      className="flex-1 sm:flex-none flex justify-center items-center gap-3 px-8 py-3 rounded-full text-sm font-black bg-[#00F0FF] text-[#030014] shadow-lg disabled:opacity-30 transition-all">
                      الحلقة التالية <ChevronLeft className="w-4 h-4" />
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

              {!theaterMode && (
                <div className="flex items-start gap-3 mt-3 px-4 py-3 rounded-2xl bg-[#B026FF]/5 border border-[#B026FF]/20 text-right">
                  <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#B026FF]/20 flex items-center justify-center">
                    <span className="text-[#B026FF] text-[10px] font-black">!</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed font-bold">
                    <span className="text-[#B026FF] font-black">ملاحظة مجتمعية:</span> زرار <span className="text-white/80">"تخطي الانترو"</span> يُساعد الجميع — اضغطه فقط عند بداية الانترو، ولا تضغطه في أي وقت آخر حتى يعمل النظام بدقة لك وللمشاهدين القادمين. 🎯
                  </p>
                </div>
              )}
            </div>

            <div className={`${theaterMode ? 'hidden' : 'lg:col-span-1 xl:col-span-1'} flex flex-col gap-6 px-4 sm:px-0 min-w-0 w-full max-w-full`}>
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
                  <div className="text-[10px] text-white/45 font-bold mb-2">
                    وضع السرعة القصوى مفعل: التحميل يتم عبر سيرفر الموقع مباشرة بأقصى سرعة ممكنة.
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
                        <span className="text-xs font-black tracking-wide">جاري التنزيل... {downloadProgress}% ({downloadSpeedMBps.toFixed(2)} MB/s)</span>
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
