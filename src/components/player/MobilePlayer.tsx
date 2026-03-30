'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Settings, FastForward, RotateCcw, RotateCw, Monitor, Sun, X, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { skipTimesCache } from './CustomPlayer';

interface MobilePlayerProps {
    videoUrl: string;
    poster?: string;
    title?: string;
    subtitle?: string;
    onVideoEnd?: () => void;
    autoPlay?: boolean;
    startTime?: number;
    onTimeUpdate?: (currentTime: number) => void;
    manualQualities?: { quality: string, serverId: string }[];
    onQualityChange?: (serverId: string) => void;
    currentManualQuality?: string;
    malId?: string | number | null;
    episodeNumber?: number;
}

const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const h = Math.floor(time / Math.pow(60, 2));
    const m = Math.floor((time % Math.pow(60, 2)) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const checkIsIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export function MobilePlayer({
    videoUrl, poster, title, subtitle, onVideoEnd, autoPlay = true,
    startTime = 0, onTimeUpdate, manualQualities = [], onQualityChange,
    currentManualQuality, malId, episodeNumber
}: MobilePlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const previewHlsRef = useRef<Hls | null>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isWaiting, setIsWaiting] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [brightness, setBrightness] = useState(100);
    const [isPortrait, setIsPortrait] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [qualities, setQualities] = useState<{ id: number, label: string }[]>([]);
    const [currentQuality, setCurrentQuality] = useState<number>(-1);
    const [isThumbnailInit, setIsThumbnailInit] = useState(false);

    const [hasSkippedIntro, setHasSkippedIntro] = useState(false);
    const [skipTimes, setSkipTimes] = useState<{ op?: { start: number, end: number }, ed?: { start: number, end: number } }>({});
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Hover features (For mouse support on mobile view)
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPos, setHoverPos] = useState<number>(0);

    // Gestures state
    const [touchStartPos, setTouchStartPos] = useState<{ x: number, y: number } | null>(null);
    const [lastTap, setLastTap] = useState<{ time: number, x: number } | null>(null);
    const [indicator, setIndicator] = useState<{ type: 'rewind' | 'forward' | 'brightness' | 'volume' | 'play' | 'pause', value?: number } | null>(null);
    const indicatorTimeout = useRef<NodeJS.Timeout | null>(null);

    // Scrubbing Thumbnail State
    const [scrubTime, setScrubTime] = useState<number | null>(null);
    const [isThumbnailReady, setIsThumbnailReady] = useState(false);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // HLS Integration
    useEffect(() => {
        const video = videoRef.current;
        const previewVideo = previewVideoRef.current;
        if (!video || !videoUrl) return;

        let hls: Hls | null = null;
        let previewHls: Hls | null = null;
        setIsWaiting(true);
        const isM3u8 = videoUrl.toLowerCase().includes('.m3u8');
        const isIOS = checkIsIOS();

        if (isM3u8 && Hls.isSupported() && !isIOS) {
            hls = new Hls({
                enableWorker: true,
                maxBufferLength: 5,
                maxMaxBufferLength: 10,
                maxBufferSize: 5 * 1024 * 1024, // 5MB for bullet start
                startLevel: 0,
                backBufferLength: 0,
                lowLatencyMode: true,
                nudgeOffset: 0.1,
                nudgeMaxRetry: 10
            });
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                const availableQualities = data.levels.map((level, index) => ({
                    id: index, label: level.height + 'p'
                })).sort((a, b) => b.id - a.id);
                setQualities(availableQualities);
                if (autoPlay) video.play().catch(() => setIsPlaying(false));
                setIsWaiting(false);
            });
            hlsRef.current = hls;
        } else {
            video.src = videoUrl;
            video.load();
            if (autoPlay) video.play().catch(() => setIsPlaying(false));
        }

        // Native iOS Fullscreen listeners
        const handleIOSFullscreenBegin = () => { setIsFullscreen(true); setShowControls(false); };
        const handleIOSFullscreenEnd = () => setIsFullscreen(false);

        video.addEventListener('webkitbeginfullscreen', handleIOSFullscreenBegin);
        video.addEventListener('webkitendfullscreen', handleIOSFullscreenEnd);

        return () => {
            if (hls) hls.destroy();
            if (previewHlsRef.current) {
                previewHlsRef.current.destroy();
                previewHlsRef.current = null;
            }
            video.removeEventListener('webkitbeginfullscreen', handleIOSFullscreenBegin);
            video.removeEventListener('webkitendfullscreen', handleIOSFullscreenEnd);
        };
    }, [videoUrl, autoPlay]);

    const initThumbnailPreview = useCallback(() => {
        if (isThumbnailInit || !videoUrl) return;
        const previewVideo = previewVideoRef.current;
        if (!previewVideo) return;

        const isM3u8 = videoUrl.toLowerCase().includes('.m3u8');
        const isIOS = checkIsIOS();

        if (isM3u8 && Hls.isSupported() && !isIOS) {
            const ph = new Hls({ 
                autoStartLoad: false,
                startLevel: 0,
                capLevelToPlayerSize: true,
                enableWorker: true,
                maxBufferLength: 2,
                maxBufferSize: 1 * 1024 * 1024
            });
            ph.loadSource(videoUrl);
            ph.attachMedia(previewVideo);

            // Force 240p if available
            ph.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                const levels = data.levels;
                const index240p = levels.findIndex(l => l.height === 240);
                if (index240p !== -1) {
                    ph.currentLevel = index240p;
                    ph.loadLevel = index240p;
                } else {
                    ph.currentLevel = 0; // fallback to lowest
                }
            });

            previewHlsRef.current = ph;
        } else {
            previewVideo.src = videoUrl;
            previewVideo.load();
        }
        setIsThumbnailInit(true);
    }, [isThumbnailInit, videoUrl]);

    // Unified Skip Times Integration (AniSkip + Anime-Skip Fallback)
    useEffect(() => {
        if (!malId || !episodeNumber) return;
        
        const cacheKey = `${malId}-${episodeNumber}`;
        if (skipTimesCache[cacheKey]) {
            setSkipTimes(skipTimesCache[cacheKey]);
            return;
        }

        const fetchSkipTimes = async () => {
            try {
                const res = await fetch(`/api/skip?malId=${malId}&episode=${episodeNumber}`, { cache: 'no-store' });
                if (!res.ok) {
                    skipTimesCache[cacheKey] = { op: null, ed: null }; // Cache "not found"
                    return;
                }
                const data = await res.json();
                if (data.times) {
                    skipTimesCache[cacheKey] = data.times;
                    setSkipTimes(data.times);
                    console.log('[Skip] Loaded from source:', data.source, data.times);
                }
            } catch (err) {
                console.warn('Skip API failed', err);
            }
        };
        fetchSkipTimes();
    }, [malId, episodeNumber]);

    const showIndicatorMsg = useCallback((type: 'rewind' | 'forward' | 'brightness' | 'volume' | 'play' | 'pause', value?: number) => {
        setIndicator({ type, value });
        if (indicatorTimeout.current) clearTimeout(indicatorTimeout.current);
        indicatorTimeout.current = setTimeout(() => setIndicator(null), 1000);
    }, []);

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) playPromise.catch(() => {});
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
            setShowControls(true);
            hideControlsLater();
        }
    }, []);

    const seekBy = useCallback((amount: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += amount;
            showIndicatorMsg(amount > 0 ? 'forward' : 'rewind');
            setShowControls(true);
            hideControlsLater();
        }
    }, [showIndicatorMsg]);

    const handleTimeUpdateEvent = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const dur = videoRef.current.duration;
            setCurrentTime(current);
            if (dur && !isNaN(dur) && dur > 0 && scrubTime === null) {
                setProgress((current / dur) * 100);
            }
            onTimeUpdate?.(current);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (startTime > 0) {
                videoRef.current.currentTime = startTime;
            }
            setIsWaiting(false);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seekTo = Number(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = (seekTo / 100) * duration;
            setProgress(seekTo);
            setShowControls(true);
            hideControlsLater();
        }
        setScrubTime(null);
    };

    const handleSeekTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const touch = e.touches[0];
        let percent = (touch.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        setProgress(percent * 100);
        
        const time = percent * duration;
        setScrubTime(time);

        if (!isThumbnailInit) initThumbnailPreview();

        if (previewVideoRef.current) {
            // Prime the video on first touch for mobile
            if (previewVideoRef.current.paused && previewVideoRef.current.readyState === 0) {
                 previewVideoRef.current.play().then(() => previewVideoRef.current?.pause()).catch(() => {});
            }

            if (Math.abs(previewVideoRef.current.currentTime - time) > 0.5) {
                setIsThumbnailReady(false);
                if (previewHlsRef.current) {
                    previewHlsRef.current.startLoad();
                }
                if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
                seekTimeoutRef.current = setTimeout(() => {
                    if (previewVideoRef.current) previewVideoRef.current.currentTime = time;
                }, 50);
            }
        }
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };

    const handleSeekTouchEnd = () => {
        setScrubTime(null);
        setHoverTime(null);
    };

    const handleTimelineMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Only do this if it's a mouse (pointers have types)
        if (e.nativeEvent instanceof PointerEvent && e.nativeEvent.pointerType !== 'mouse') return;
        const rect = e.currentTarget.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        const time = percent * (videoRef.current?.duration || 0);
        
        setHoverTime(time);
        setHoverPos(percent * 100);

        if (!isThumbnailInit) initThumbnailPreview();

        if (previewVideoRef.current && Math.abs(previewVideoRef.current.currentTime - time) > 0.5) {
            setIsThumbnailReady(false);
            if (previewHlsRef.current) {
                previewHlsRef.current.startLoad();
            }
            if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
            seekTimeoutRef.current = setTimeout(() => {
                if (previewVideoRef.current) previewVideoRef.current.currentTime = time;
            }, 50);
        }
    }, [isThumbnailInit, initThumbnailPreview]);

    const handleSeekInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isThumbnailInit) initThumbnailPreview();
        handleSeek(e);
        const time = (value / 100) * duration;
        setScrubTime(time);
        
        if (previewVideoRef.current && Math.abs(previewVideoRef.current.currentTime - time) > 0.5) {
            setIsThumbnailReady(false);
            if (previewHlsRef.current) {
                previewHlsRef.current.startLoad();
            }
            if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
            seekTimeoutRef.current = setTimeout(() => {
                if (previewVideoRef.current) previewVideoRef.current.currentTime = time;
            }, 50);
        }
    }, [isThumbnailInit, initThumbnailPreview, handleSeek, duration]);

    const handleTimelineMouseLeave = useCallback(() => {
        setHoverTime(null);
    }, []);

    const handlePreviewSeeked = () => {
        if (!previewVideoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
             ctx.drawImage(previewVideoRef.current, 0, 0, 320, 180);
             setIsThumbnailReady(true);
        }
    };

    const hideControlsLater = () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying && !showSettings && scrubTime === null) {
                setShowControls(false);
            }
        }, 3500);
    };

    const toggleFullscreen = () => {
        const elem = containerRef.current;
        const video = videoRef.current as any;
        if (!elem || !video) return;

        const doc = document as any;

        if (isFullscreen || doc.fullscreenElement || doc.webkitFullscreenElement) {
            if (doc.exitFullscreen) doc.exitFullscreen().catch(() => { });
            else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
            else if (video.webkitExitFullscreen) video.webkitExitFullscreen();
            
            setIsFullscreen(false);
            try {
                const navScreen = window.screen as any;
                if (navScreen.orientation && navScreen.orientation.unlock) {
                    navScreen.orientation.unlock();
                }
            } catch (e) {}
            return;
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (isIOS && video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
            setIsFullscreen(true);
            return;
        }

        if (elem.requestFullscreen) {
            elem.requestFullscreen().then(() => {
                setIsFullscreen(true);
                try {
                    const navScreen = window.screen as any;
                    if (navScreen.orientation && navScreen.orientation.lock) {
                        navScreen.orientation.lock('landscape').catch(() => null);
                    }
                } catch (e) {}
            }).catch(() => setIsFullscreen(true));
        } else if ((elem as any).webkitRequestFullscreen) {
            (elem as any).webkitRequestFullscreen();
            setIsFullscreen(true);
        } else {
            setIsFullscreen(true);
        }
    };

    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
            window.scrollTo(0, 0);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isFullscreen]);

    // Gestures Logic
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setTouchStartPos({ x: touch.clientX, y: touch.clientY });

        const now = Date.now();
        if (lastTap && (now - lastTap.time) < 300) {
            const screenWidth = window.innerWidth;
            if (touch.clientX < screenWidth * 0.3) {
                seekBy(-10);
            } else if (touch.clientX > screenWidth * 0.7) {
                seekBy(10);
            } else {
                togglePlay();
            }
            setLastTap(null);
        } else {
            setLastTap({ time: now, x: touch.clientX });
            setShowControls(true);
            hideControlsLater();
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartPos || showSettings) return;
        const touch = e.touches[0];
        const deltaY = touchStartPos.y - touch.clientY;
        const screenWidth = window.innerWidth;

        if (Math.abs(deltaY) > 20) {
            if (touchStartPos.x >= screenWidth * 0.5) {
                let newV = volume + (deltaY * 0.005);
                newV = Math.max(0, Math.min(1, newV));
                setVolume(newV);
                if (videoRef.current) videoRef.current.volume = newV;
                setTouchStartPos({ x: touch.clientX, y: touch.clientY });
                showIndicatorMsg('volume', Math.round(newV * 100));
            }
        }
    };

    const handleTouchEnd = () => {
        setTouchStartPos(null);
    };

    const playerContent = (
        <div
            ref={containerRef}
            className={`relative bg-black flex items-center justify-center transition-all duration-300
        ${isFullscreen ? 'fixed inset-0 z-[2147483647] m-0 p-0 rounded-none w-full h-full' : 'overflow-hidden aspect-video rounded-[1rem] border border-white/10 shadow-lg w-full'}`}
            style={isFullscreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647 } : {}}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => {
                e.stopPropagation();
                setShowControls(true);
                hideControlsLater();
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x < rect.width * 0.3) {
                    seekBy(-10);
                } else if (x > rect.width * 0.7) {
                    seekBy(10);
                } else {
                    togglePlay();
                }
            }}
        >
            <div className={`relative flex items-center justify-center flex-col overflow-hidden w-full ${isFullscreen && isPortrait ? 'aspect-video shadow-[0_0_50px_rgba(0,0,0,1)] z-10' : 'h-full'} min-w-0 max-w-full`}>

            {/* Gesture Indicators */}
            <AnimatePresence>
                {indicator && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center text-white border border-white/10 shadow-2xl">
                            {indicator.type === 'volume' && <><Volume2 className="w-8 h-8 mb-2 text-[#00F0FF]" /><span className="text-xl font-bold">{indicator.value}%</span></>}
                            {indicator.type === 'brightness' && <><Sun className="w-8 h-8 mb-2 text-[#B026FF]" /><span className="text-xl font-bold">{indicator.value}%</span></>}
                            {indicator.type === 'rewind' && <><RotateCcw className="w-10 h-10 text-white" /><span className="text-sm mt-2">-10s</span></>}
                            {indicator.type === 'forward' && <><RotateCw className="w-10 h-10 text-white" /><span className="text-sm mt-2">+10s</span></>}
                            {indicator.type === 'play' && <Play className="w-10 h-10 text-white fill-white ml-2" />}
                            {indicator.type === 'pause' && <Pause className="w-10 h-10 text-white fill-white" />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isWaiting && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
                    >
                        <Loader2 className="w-12 h-12 text-[#00F0FF] animate-spin drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {!isPlaying && !isWaiting && !showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto transition-all"
                        >
                            <Play className="w-8 h-8 text-white fill-white ml-1.5 opacity-100" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <video
                ref={videoRef}
                poster={poster}
                className="w-full h-full object-contain transition-all duration-300 pointer-events-none"
                onTimeUpdate={handleTimeUpdateEvent}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={onVideoEnd}
                onWaiting={() => setIsWaiting(true)}
                onPlaying={() => setIsWaiting(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => { setIsPlaying(true); setIsWaiting(false); }}
                playsInline
                webkit-playsinline="true"
                controls={false}
            />

            <video
                ref={previewVideoRef}
                className="opacity-0 absolute pointer-events-none w-[320px] h-[180px] top-[-1000px] left-[-1000px]"
                playsInline
                preload="auto"
                muted
                onSeeked={handlePreviewSeeked}
            />
            
            </div>{/* End of inner portrait video constraints */}

            {/* Hardware Accelerated Brightness Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none z-[15]" 
                style={{ 
                    backgroundColor: brightness < 100 ? 'black' : 'white', 
                    opacity: brightness < 100 ? (100 - brightness) / 100 : (brightness - 100) / 100 
                }} 
            />

            {/* Redesigned Controls matches CustomPlayer */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-0 left-0 right-0 z-[70] pointer-events-none bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-32 pb-4 px-4 flex flex-col"
                    >
                        {/* Title and Timeline Block */}
                        <div className="flex flex-col mb-4 pointer-events-auto w-full relative min-w-0">
                            {/* Text Info */}
                            <div className="mb-2 min-w-0 pr-4">
                                {title && <h2 className="text-white text-base sm:text-lg font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide truncate max-w-full">{title}</h2>}
                                {subtitle && <p className="text-[#00F0FF] text-[10px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase mt-0.5 truncate max-w-full">{subtitle}</p>}
                            </div>

                            {/* Timeline */}
                            <div className="flex items-center gap-3 relative w-full group/slider mt-1">
                                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-[10px] font-black w-8 text-center">{formatTime(currentTime)}</span>
                                
                                {/* Track */}
                                <div 
                                    className="relative flex-1 h-3 bg-white/20 rounded-full cursor-pointer transition-all outline-none flex items-center overflow-visible"
                                    onMouseMove={handleTimelineMouseMove}
                                    onMouseLeave={handleTimelineMouseLeave}
                                >
                                     
                                    {/* Thumbnail Hover Tooltip (Active when dragging via scrubTime or hovering via hoverTime) */}
                                    <AnimatePresence>
                                        {(scrubTime !== null || hoverTime !== null) && (
                                            <motion.div 
                                                initial={{opacity: 0, y: 10, scale: 0.9}} 
                                                animate={{opacity: 1, y: 0, scale: 1}} 
                                                exit={{opacity: 0, scale: 0.9}}
                                                className="absolute bottom-full mb-3 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[80]"
                                                style={{ left: `${scrubTime !== null ? (isNaN(progress) ? 0 : progress) : hoverPos}%` }}>
                                               <div className="w-40 sm:w-48 aspect-video bg-[#05001A] border-2 border-white/10 rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative">
                                                   <canvas ref={canvasRef} width={320} height={180} className={`w-full h-full object-cover transition-opacity duration-200 ${isThumbnailReady ? 'opacity-100' : 'opacity-0'}`} />
                                                   {!isThumbnailReady && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                        </div>
                                                   )}
                                                   <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2.5 py-1 rounded text-[10px] sm:text-xs font-black text-white shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{formatTime(scrubTime !== null ? scrubTime : (hoverTime || 0))}</div>
                                               </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Filled progress */}
                                    <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-full pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.3)]" style={{ width: `${isNaN(progress) ? 0 : progress}%` }}>
                                         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md transition-transform scale-110" />
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" step="0.1" 
                                        value={isNaN(progress) ? 0 : progress} 
                                        onChange={handleSeek} 
                                        onTouchStart={handleSeekTouchMove}
                                        onTouchMove={handleSeekTouchMove}
                                        onTouchEnd={handleSeekTouchEnd}
                                        onTouchCancel={handleSeekTouchEnd}
                                        onMouseLeave={handleSeekTouchEnd}
                                        onMouseUp={handleSeekTouchEnd}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            let p = (e.clientX - rect.left) / rect.width;
                                            p = Math.max(0, Math.min(1, p));
                                            if(videoRef.current) videoRef.current.currentTime = p * duration;
                                            setProgress(p * 100);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 pointer-events-auto" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Actions Row */}
                        <div className="flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }} className="text-white/80 hover:text-white transition-transform active:scale-90 drop-shadow-lg"><RotateCcw className="w-5 h-5" /></button>
                                
                                <motion.button
                                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-[#00F0FF] to-[#B026FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all z-10 mx-2"
                                >
                                    <div className="absolute inset-0 rounded-full bg-black/20 m-[2px]" />
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6 text-white relative z-10 fill-white" />
                                    ) : (
                                        <Play className="w-6 h-6 text-white relative z-10 fill-white ml-1.5" />
                                    )}
                                </motion.button>
                                
                                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }} className="text-white/80 hover:text-white transition-transform active:scale-90 drop-shadow-lg"><RotateCw className="w-5 h-5" /></button>

                                <button onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (videoRef.current) {
                                        const cTime = videoRef.current.currentTime;
                                        videoRef.current.currentTime += 85;
                                        if (cTime < 300 && episodeNumber && malId) {
                                            const reportId = String(malId);
                                            fetch('/api/skip/report', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ malId: reportId, episode: episodeNumber, type: 'op', startTime: Math.floor(cTime), endTime: Math.floor(cTime + 85) })
                                            }).then(r => r.json()).then(d => console.log('[Skip Report]', d)).catch(console.error);
                                        }
                                    }
                                }} className="flex items-center gap-1.5 px-2 py-1.5 ml-1 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/10 text-white font-bold text-[10px] sm:text-xs active:scale-95 transition-all outline-none drop-shadow-lg pointer-events-auto">
                                    <FastForward className="w-3.5 h-3.5" /> تخطي الانترو
                                </button>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4">                                
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button onClick={() => {
                                        if (videoRef.current) {
                                            const newVol = volume === 0 ? 1 : 0;
                                            videoRef.current.volume = newVol;
                                            setVolume(newVol);
                                            showIndicatorMsg('volume', Math.round(newVol * 100));
                                        }
                                    }} className="text-white hover:text-[#00F0FF] transition-all drop-shadow-lg p-1.5 sm:p-2">
                                        {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                    <input 
                                        type="range" min="0" max="1" step="0.05" value={volume} 
                                        onChange={(e) => {
                                            const newV = Number(e.target.value);
                                            setVolume(newV);
                                            if (videoRef.current) videoRef.current.volume = newV;
                                        }} 
                                        className="w-12 sm:w-16 hidden sm:block accent-[#00F0FF] h-1 bg-white/20 rounded-full outline-none cursor-pointer" 
                                    />
                                </div>

                                <button onClick={() => toggleFullscreen()} className="text-white hover:text-[#00F0FF] transition-all drop-shadow-lg p-2">
                                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                                </button>
                                
                                <div className="relative">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowControls(true); hideControlsLater(); }} 
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-white text-[10px] font-black transition-all"
                                    >
                                        <Settings className={`w-4 h-4 ${showSettings ? 'animate-spin-slow text-[#00F0FF]' : ''}`} />
                                        {qualities.length > 0 ? (currentQuality === -1 ? 'AUTO' : qualities.find(q => q.id === currentQuality)?.label) : (currentManualQuality || 'HD')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Intelligent AniSkip Overlays - Mobile */}
            <AnimatePresence>
                {skipTimes.op && currentTime >= skipTimes.op.start && currentTime <= skipTimes.op.end && scrubTime === null && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        onClick={(e) => { e.stopPropagation(); if (videoRef.current) { setIsWaiting(true); videoRef.current.currentTime = skipTimes.op!.end; videoRef.current.play().finally(() => setIsWaiting(false)); } }}
                        className="absolute bottom-32 right-4 z-[70] px-4 py-2 bg-[#030014]/80 backdrop-blur-xl border border-[#00F0FF]/30 text-[#00F0FF] rounded-xl font-black text-[10px] shadow-2xl transition-all flex items-center gap-2 pointer-events-auto"
                    >
                        <FastForward className="w-4 h-4" /> تخطي الانترو
                    </motion.button>
                )}
                {skipTimes.ed && currentTime >= skipTimes.ed.start && currentTime <= skipTimes.ed.end && scrubTime === null && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        onClick={(e) => { e.stopPropagation(); if (videoRef.current) { setIsWaiting(true); videoRef.current.currentTime = skipTimes.ed!.end; videoRef.current.play().finally(() => setIsWaiting(false)); } }}
                        className="absolute bottom-32 right-4 z-[70] px-4 py-2 bg-[#030014]/80 backdrop-blur-xl border border-[#00F0FF]/30 text-[#00F0FF] rounded-xl font-black text-[10px] shadow-2xl transition-all flex items-center gap-2 pointer-events-auto"
                    >
                        <FastForward className="w-4 h-4" /> تخطي النهاية
                    </motion.button>
                )}

            </AnimatePresence>

            {/* Advanced Settings Panel - Mission Control Mobile */}
            <AnimatePresence>
                {showSettings && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={(e) => { e.stopPropagation(); setShowSettings(false); }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[90]"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-0 bottom-0 w-[80vw] max-w-[320px] bg-[#05001A] shadow-[-20px_0_50px_rgba(0,0,0,0.8)] border-l border-white/5 z-[100] flex flex-col pointer-events-auto"
                        >
                            <div className="p-5 border-b border-white/5 flex items-center justify-between pb-4 mt-2">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-[#00F0FF] animate-spin-slow" /> MISSION CONTROL
                                </span>
                                <button onClick={() => setShowSettings(false)} className="p-2 bg-white/5 rounded-full text-white"><X className="w-4 h-4" /></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                                {/* Volume Control Slider */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-[11px] text-white/50 font-bold"><span>مستوى الصوت</span><span className="text-[#00F0FF]">{Math.round(volume * 100)}%</span></div>
                                    <div className="flex items-center gap-3">
                                        <VolumeX className="w-4 h-4 text-white/40" />
                                        <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => {
                                            const newV = Number(e.target.value);
                                            setVolume(newV);
                                            if (videoRef.current) videoRef.current.volume = newV;
                                        }} className="flex-1 accent-[#00F0FF] bg-white/10 h-1.5 rounded-full outline-none" />
                                        <Volume2 className="w-4 h-4 text-white/40" />
                                    </div>
                                </div>

                                {/* Speed Settings */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-[11px] text-white/50 font-bold"><span>السرعة</span><span className="text-[#00F0FF]">{playbackRate}X</span></div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[0.5, 1, 1.5, 2].map((rate) => (
                                            <button 
                                              key={rate} 
                                              onClick={() => { if (videoRef.current) videoRef.current.playbackRate = rate; setPlaybackRate(rate); }} 
                                              className={`py-2 rounded-xl text-xs font-black transition-all ${playbackRate === rate ? 'bg-[#00F0FF] text-[#05001A] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white/60'}`}
                                            >
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Brightness Control Slider */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-[11px] text-white/50 font-bold"><span>مستوى الإضاءة</span><span className="text-[#B026FF]">{Math.round(brightness)}%</span></div>
                                    <div className="flex items-center gap-3">
                                        <Sun className="w-4 h-4 text-white/40" />
                                        <input type="range" min="30" max="150" step="1" value={brightness} onChange={(e) => {
                                            setBrightness(Number(e.target.value));
                                        }} className="flex-1 accent-[#B026FF] bg-white/10 h-1.5 rounded-full outline-none" />
                                    </div>
                                </div>

                                {/* Quality Selection */}
                                {(qualities.length > 0 || manualQualities.length > 0) && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between text-[11px] text-white/50 font-bold mb-1"><span>الجودة</span><span className="text-[#00F0FF]">{currentQuality === -1 ? 'Auto' : qualities.find(q => q.id === currentQuality)?.label || currentManualQuality || 'HD'}</span></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {qualities.length > 0 ? (
                                                <>
                                                    <button onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = -1; setCurrentQuality(-1); setShowSettings(false); }} className={`py-3 flex justify-center rounded-xl text-xs font-black transition-all ${currentQuality === -1 ? 'bg-[#00F0FF] text-[#05001A] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white/60'}`}>Auto</button>
                                                    {qualities.map(q => (
                                                        <button key={q.id} onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = q.id; setCurrentQuality(q.id); setShowSettings(false); }} className={`py-3 flex justify-center rounded-xl text-xs font-black transition-all ${currentQuality === q.id ? 'bg-[#00F0FF] text-[#05001A] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white/60'}`}>{q.label}</button>
                                                    ))}
                                                </>
                                            ) : (
                                                manualQualities.map(q => (
                                                    <button key={q.serverId} onClick={() => { onQualityChange?.(q.serverId); setShowSettings(false); }} className={`py-3 flex justify-center rounded-xl text-xs font-black transition-all ${currentManualQuality === q.quality ? 'bg-[#00F0FF] text-[#05001A] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white/60'}`}>{q.quality}</button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );

    return playerContent;
}
