'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Settings, FastForward, RotateCcw, RotateCw, Monitor, Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';

interface CustomPlayerProps {
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

// Global cache to prevent redundant API calls when changing server/quality
export const skipTimesCache: Record<string, any> = {};

const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const checkIsIOS = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return isIOS;
};

export function CustomPlayer({ 
    videoUrl, poster, title, subtitle, onVideoEnd, autoPlay = true, 
    startTime = 0, onTimeUpdate, manualQualities = [], onQualityChange, 
    currentManualQuality, malId, episodeNumber 
}: CustomPlayerProps) {
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
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isWaiting, setIsWaiting] = useState(true);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [brightness, setBrightness] = useState(100);
    const [showSettings, setShowSettings] = useState(false);
    const [qualities, setQualities] = useState<{ id: number, label: string }[]>([]);
    const [currentQuality, setCurrentQuality] = useState<number>(-1);
    const [aspectRatio, setAspectRatio] = useState<number>(16/9);
    
    const [showCursor, setShowCursor] = useState(true);
    const [hasSkippedIntro, setHasSkippedIntro] = useState(false);
    const [skipTimes, setSkipTimes] = useState<{ op?: { start: number, end: number }, ed?: { start: number, end: number } }>({});
    const controlsTimeoutRef = useRef<NodeJS.Timeout|null>(null);

    // Hover features
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPercent, setHoverPercent] = useState<number>(0);
    const [isThumbnailReady, setIsThumbnailReady] = useState(false);
    const [isThumbnailInit, setIsThumbnailInit] = useState(false);
    
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
                maxBufferLength: 30, // Increased for stability
                maxMaxBufferLength: 60,
                maxBufferSize: 60 * 1024 * 1024, // 60MB
                startLevel: 0,
                backBufferLength: 30,
                lowLatencyMode: true,
                nudgeOffset: 0.1,
                nudgeMaxRetry: 15
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

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls?.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls?.recoverMediaError();
                            break;
                        default:
                            setIsWaiting(true);
                            break;
                    }
                }
            });

            hlsRef.current = hls;
        } else {
            // Force native HLS on iOS or fallback
            video.src = videoUrl;
            video.load();
            if (autoPlay) {
                video.play().then(() => {
                    setIsPlaying(true);
                    setIsWaiting(false);
                }).catch(() => {
                    setIsPlaying(false);
                });
            }
        }

        // Pure native breakout for iOS - we don't sync isFullscreen state
        // to avoid layout shifts in the background page.
        const handleIOSFullscreenEnd = () => setIsFullscreen(false);

        video.addEventListener('webkitendfullscreen', handleIOSFullscreenEnd);

        return () => {
            if (hls) hls.destroy();
            if (previewHlsRef.current) {
                previewHlsRef.current.destroy();
                previewHlsRef.current = null;
            }
            video.removeEventListener('webkitendfullscreen', handleIOSFullscreenEnd);
        };
    }, [videoUrl, autoPlay]);

    // Stall Guardian: Monitor if video is stuck despite isPlaying being true
    useEffect(() => {
        let lastTime = 0;
        let stallCount = 0;
        const interval = setInterval(() => {
            const video = videoRef.current;
            if (!video || !isPlaying || isWaiting || showSettings) return;
            
            // If time hasn't changed but we are at the start and app thinks it's playing
            if (video.currentTime === lastTime && video.currentTime < duration - 1) {
                stallCount++;
                if (stallCount > 3) {
                    console.warn('[StallGuardian] Nudging video...');
                    video.currentTime += 0.1; // Gentle nudge to skip bad frames
                    stallCount = 0;
                }
            } else {
                stallCount = 0;
            }
            lastTime = video.currentTime;
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying, isWaiting, duration, showSettings]);

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
                enableWorker: true
            });
            ph.loadSource(videoUrl);
            ph.attachMedia(previewVideo);
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
                const res = await fetch(`/api/skip?malId=${malId}&episode=${episodeNumber}`);
                if (!res.ok) {
                    skipTimesCache[cacheKey] = { op: null, ed: null }; // Cache failure
                    return;
                }
                const data = await res.json();
                if (data.times) {
                    skipTimesCache[cacheKey] = data.times;
                    setSkipTimes(data.times);
                }
            } catch (err) {
                console.warn('Skip API failed', err);
            }
        };
        fetchSkipTimes();
    }, [malId, episodeNumber]);

    // Keyboard shortcut to skip intro/outro
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 's') {
                if (skipTimes.op && currentTime >= skipTimes.op.start && currentTime <= skipTimes.op.end) {
                    if (videoRef.current) videoRef.current.currentTime = skipTimes.op.end;
                } else if (skipTimes.ed && currentTime >= skipTimes.ed.start && currentTime <= skipTimes.ed.end) {
                    if (videoRef.current) videoRef.current.currentTime = skipTimes.ed.end;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTime, skipTimes]);

    const handleTimelineMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        setHoverPercent(percent);
        const time = percent * duration;
        setHoverTime(time);
        
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
    }, [duration, isThumbnailInit, initThumbnailPreview]);

    const handleTimelineTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const touch = e.touches[0];
        let percent = (touch.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        setHoverPercent(percent);
        const time = percent * duration;
        setHoverTime(time);
        
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
    }, [duration, isThumbnailInit, initThumbnailPreview]);

    const handlePreviewSeeked = () => {
        if (!previewVideoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
             ctx.drawImage(previewVideoRef.current, 0, 0, 320, 180);
             setIsThumbnailReady(true);
        }
    };

    const togglePlay = () => {
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
    };

    const handleTimeUpdateEvent = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const dur = videoRef.current.duration;
            setCurrentTime(current);
            if (dur && !isNaN(dur) && dur > 0) {
                setProgress((current / dur) * 100);
            }
            onTimeUpdate?.(current);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;
            if (videoWidth && videoHeight) {
                setAspectRatio(videoWidth / videoHeight);
            }
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
    };

    const hideControlsLater = () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying && !showSettings) {
                setShowControls(false);
                setShowCursor(false);
            }
        }, 3500);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        setShowCursor(true);
        hideControlsLater();
    };    

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
            setShowControls(true);
            hideControlsLater();
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = Number(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
            setShowControls(true);
            hideControlsLater();
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        const elem = containerRef.current as any;
        const doc = document as any;

        setShowControls(true);
        hideControlsLater();

        if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || isFullscreen) {
            if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
            else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
            setIsFullscreen(false);
            return;
        }

        const video = videoRef.current as any;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        if (isIOS && video && video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
            return;
        }

        if (elem.requestFullscreen) {
            elem.requestFullscreen().then(() => {
                setIsFullscreen(true);
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

    const playerContent = (
        <div
            ref={containerRef}
            className={`relative bg-black flex items-center justify-center overflow-hidden w-full transition-all duration-300 group
        ${isFullscreen ? 'fixed !top-0 !left-0 !right-0 !bottom-0 !z-[2147483647] m-0 p-0 rounded-none w-screen h-[100dvh]' : 'rounded-[2rem] border border-white/10 shadow-2xl'}
        ${!showCursor && isPlaying ? 'cursor-none' : 'cursor-default'}`}
            style={isFullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 2147483647 } : { aspectRatio: `${aspectRatio}` }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if (isPlaying) { setShowControls(false); setShowCursor(false); } }}
            onClick={(e) => { 
                e.stopPropagation();
                setShowControls(true); 
                setShowCursor(true); 
                hideControlsLater(); 
            }}
            onDoubleClick={() => toggleFullscreen()}
        >
            <video
                ref={previewVideoRef}
                className="opacity-0 absolute pointer-events-none w-[320px] h-[180px] top-[-1000px] left-[-1000px]"
                playsInline
                preload="auto"
                muted
                onSeeked={handlePreviewSeeked}
            />

            <AnimatePresence>
                {!isPlaying && !isWaiting && !showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto hover:bg-black/90 transition-all"
                        >
                            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-2 opacity-100 hover:opacity-100" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isWaiting && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
                    >
                        <Loader2 className="w-16 h-16 text-[#00F0FF] animate-spin drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            <video
                ref={videoRef}
                poster={poster}
                className="w-full h-full object-contain transition-all duration-300"
                onTimeUpdate={handleTimeUpdateEvent}
                onLoadedMetadata={(e) => {
                    handleLoadedMetadata();
                    setIsWaiting(false);
                }}
                onCanPlay={() => setIsWaiting(false)}
                onEnded={onVideoEnd}
                onWaiting={() => setIsWaiting(true)}
                onPlaying={() => setIsWaiting(false)}
                onPause={() => {
                    setIsPlaying(false);
                    setIsWaiting(false); // Clear spinner on pause
                }}
                onPlay={() => { 
                    setIsPlaying(true); 
                    setIsWaiting(false); 
                }}
                playsInline={true}
                controls={false}
                autoPlay={autoPlay}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* Hardware Accelerated Brightness Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none z-[15]" 
                style={{ 
                    backgroundColor: brightness < 100 ? 'black' : 'white', 
                    opacity: brightness < 100 ? (100 - brightness) / 100 : (brightness - 100) / 100 
                }} 
            />

            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-0 left-0 right-0 z-[70] pointer-events-none bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-32 pb-4 px-6 sm:px-10 flex flex-col"
                    >
                        {/* Title and Timeline Block */}
                        <div className="flex flex-col mb-4 pointer-events-auto w-full relative">
                            {/* Text Info */}
                            <div className="mb-2">
                                {title && <h2 className="text-white text-xl sm:text-2xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">{title}</h2>}
                                {subtitle && <p className="text-[#00F0FF] text-sm sm:text-base font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase mt-0.5">{subtitle}</p>}
                            </div>

                            {/* Timeline */}
                            <div className="flex items-center gap-3 sm:gap-4 relative w-full group/slider mt-1">
                                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-xs font-black w-10 text-center">{formatTime(currentTime)}</span>
                                
                                {/* Track */}
                                <div className="relative flex-1 h-1.5 sm:h-2 bg-white/20 rounded-full cursor-pointer hover:h-3 transition-all outline-none flex items-center overflow-visible"
                                     onMouseMove={handleTimelineMouseMove}
                                     onTouchMove={handleTimelineTouchMove}
                                     onMouseLeave={() => setHoverTime(null)}
                                     onTouchEnd={() => setHoverTime(null)}>
                                     
                                    {/* Thumbnail Hover Tooltip */}
                                    <AnimatePresence>
                                        {hoverTime !== null && (
                                            <motion.div 
                                                initial={{opacity: 0, y: 10, scale: 0.9}} 
                                                animate={{opacity: 1, y: 0, scale: 1}} 
                                                exit={{opacity: 0, scale: 0.9}}
                                                className="absolute bottom-full mb-3 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[80]"
                                                style={{ left: `${hoverPercent * 100}%` }}>
                                               <div className="w-48 sm:w-60 aspect-video bg-[#05001A] border-2 border-white/10 rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative">
                                                   <canvas ref={canvasRef} width={320} height={180} className={`w-full h-full object-cover transition-opacity duration-200 ${isThumbnailReady ? 'opacity-100' : 'opacity-0'}`} />
                                                   {!isThumbnailReady && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                        </div>
                                                   )}
                                                   <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2.5 py-1 rounded text-xs font-black text-white shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{formatTime(hoverTime)}</div>
                                               </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Filled progress */}
                                    <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-full pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.3)]" style={{ width: `${isNaN(progress) ? 0 : progress}%` }}>
                                         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full shadow-md transition-transform scale-100 group-hover/slider:scale-125" />
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" step="0.1" 
                                        value={isNaN(progress) ? 0 : progress} 
                                        onChange={handleSeek} 
                                        onMouseMove={handleTimelineMouseMove}
                                        onTouchMove={handleTimelineTouchMove}
                                        onMouseLeave={() => setHoverTime(null)}
                                        onMouseUp={() => setHoverTime(null)}
                                        onTouchStart={handleTimelineTouchMove}
                                        onTouchEnd={() => setHoverTime(null)}
                                        onTouchCancel={() => setHoverTime(null)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            let p = (e.clientX - rect.left) / rect.width;
                                            p = Math.max(0, Math.min(1, p));
                                            if(videoRef.current) {
                                                videoRef.current.currentTime = p * duration;
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 pointer-events-auto" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Actions Row */}
                        <div className="flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }} className="text-white/80 hover:text-white transition-transform hover:scale-110 drop-shadow-lg"><RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                                
                                <button onClick={togglePlay} className="text-white hover:text-[#00F0FF] transition-all hover:scale-105 drop-shadow-[0_0_15px_rgba(0,240,255,0.2)] p-3 sm:p-4 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                                    {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />}
                                </button>
                                
                                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }} className="text-white/80 hover:text-white transition-transform hover:scale-110 drop-shadow-lg"><RotateCw className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                                
                                <button onClick={() => { 
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
                                }} className="flex items-center gap-1.5 px-3 py-1.5 ml-2 sm:ml-4 rounded-full bg-white/10 hover:bg-white/20 hover:text-[#00F0FF] border border-white/10 text-white font-bold text-xs hover:scale-105 transition-all outline-none drop-shadow-lg">
                                    <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> تخطي الانترو
                                </button>
                                
                                <div className="hidden sm:flex items-center gap-3 group/volume ml-2">
                                    <button onClick={toggleMute} className="text-white hover:text-[#00F0FF] transition-colors drop-shadow-lg">
                                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                                    </button>
                                    <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out flex items-center h-8">
                                        <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 accent-[#00F0FF] bg-white/20 h-1.5 rounded-full outline-none cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 sm:gap-5">
                                <button onClick={async () => { try { if (videoRef.current !== document.pictureInPictureElement) await videoRef.current?.requestPictureInPicture(); else await document.exitPictureInPicture(); } catch {} }} className="hidden sm:block text-white hover:text-[#00F0FF] transition-all hover:scale-110 drop-shadow-lg p-2"><Monitor className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                                
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        const v = videoRef.current as any;
                                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                                        if (isIOS && v && v.webkitEnterFullscreen) {
                                            v.webkitEnterFullscreen();
                                        } else {
                                            toggleFullscreen();
                                        }
                                    }} 
                                    className="text-white hover:text-[#00F0FF] transition-all hover:scale-110 drop-shadow-lg p-2 active:scale-95 flex items-center justify-center pointer-events-auto"
                                >
                                    {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
                                </button>
                                
                                <div className="relative">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setShowControls(true); hideControlsLater(); }} 
                                        className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white text-[10px] sm:text-xs font-black transition-all"
                                    >
                                        <Settings className={`w-4 h-4 sm:w-4 sm:h-4 ${showSettings ? 'animate-spin-slow text-[#00F0FF]' : ''}`} />
                                        {qualities.length > 0 ? (currentQuality === -1 ? 'AUTO' : qualities.find(q => q.id === currentQuality)?.label) : (currentManualQuality || 'HD')}
                                    </button>
                                    
                                    <AnimatePresence>
                                        {showSettings && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute bottom-full right-0 mb-6 w-72 sm:w-80 bg-[#05001A] border border-white/5 rounded-[2rem] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col gap-6 z-[100] pointer-events-auto"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">MISSION CONTROL</span>
                                                    <Settings className="w-4 h-4 text-[#00F0FF] animate-spin-slow" />
                                                </div>
                                                
                                                {/* Quality */}
                                                {(qualities.length > 0 || manualQualities.length > 0) && (
                                                   <div>
                                                      <div className="flex items-center justify-between text-[11px] text-white/50 font-bold mb-3"><span>الجودة (يدوي)</span><span className="text-[#00F0FF]">{currentQuality === -1 ? 'Auto' : qualities.find(q => q.id === currentQuality)?.label || currentManualQuality || 'HD'}</span></div>
                                                      <div className="grid grid-cols-2 gap-2">
                                                          {qualities.length > 0 ? (
                                                              <>
                                                                <button onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = -1; setCurrentQuality(-1); }} className={`py-2 rounded-xl text-xs font-black transition-all ${currentQuality === -1 ? 'bg-[#00F0FF] text-[#05001A] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>Auto</button>
                                                                {qualities.map((q) => (<button key={q.id} onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = q.id; setCurrentQuality(q.id); }} className={`py-2 rounded-xl text-xs font-black transition-all ${currentQuality === q.id ? 'bg-[#00F0FF] text-[#05001A] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{q.label}</button>))}
                                                              </>
                                                          ) : (
                                                              manualQualities.map((q) => (<button key={q.serverId} onClick={() => { onQualityChange?.(q.serverId); setShowSettings(false); }} className={`py-2 rounded-xl text-xs font-black transition-all ${currentManualQuality === q.quality ? 'bg-[#00F0FF] text-[#05001A] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{q.quality}</button>))
                                                          )}
                                                      </div>
                                                   </div>
                                                )}

                                                {/* Speed */}
                                                <div>
                                                    <div className="flex items-center justify-between text-[11px] text-white/50 font-bold mb-3"><span>السرعة</span><span className="text-[#00F0FF]">{playbackRate}X</span></div>
                                                    <div className="flex gap-2">
                                                        {[0.5, 1, 1.5, 2].map((rate) => (<button key={rate} onClick={() => { if (videoRef.current) videoRef.current.playbackRate = rate; setPlaybackRate(rate); }} className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${playbackRate === rate ? 'bg-[#00F0FF] text-[#05001A] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{rate}x</button>))}
                                                    </div>
                                                </div>

                                                {/* Brightness */}
                                                <div className="flex items-center gap-3 pt-2">
                                                    <Sun className="text-white/40 w-4 h-4" />
                                                    <span className="text-[11px] font-bold text-white/40 uppercase mb-0.5">الإضاءة</span>
                                                    <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="flex-1 accent-[#B026FF] bg-white/10 h-1.5 rounded-full outline-none cursor-pointer" />
                                                    <span className="text-[#B026FF] text-[11px] font-black w-8 text-right">{brightness}%</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* Precise AniSkip Overlays */}
                {isPlaying && skipTimes.op && currentTime >= skipTimes.op.start && currentTime <= skipTimes.op.end && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        onClick={(e) => { e.stopPropagation(); if (videoRef.current) { setIsWaiting(true); videoRef.current.currentTime = skipTimes.op!.end; videoRef.current.play().finally(() => setIsWaiting(false)); } }}
                        className="absolute bottom-32 sm:bottom-40 right-6 sm:right-10 z-[70] px-5 py-2.5 bg-[#030014]/80 backdrop-blur-xl border border-[#00F0FF]/30 text-[#00F0FF] rounded-xl font-black text-xs sm:text-sm shadow-2xl hover:bg-[#00F0FF] hover:text-[#05001A] hover:border-[#00F0FF] transition-all flex items-center gap-2 pointer-events-auto"
                    >
                        <FastForward className="w-4 h-4" /> تخطي الانترو
                    </motion.button>
                )}
                {isPlaying && skipTimes.ed && currentTime >= skipTimes.ed.start && currentTime <= skipTimes.ed.end && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        onClick={(e) => { e.stopPropagation(); if (videoRef.current) { setIsWaiting(true); videoRef.current.currentTime = skipTimes.ed!.end; videoRef.current.play().finally(() => setIsWaiting(false)); } }}
                        className="absolute bottom-32 sm:bottom-40 right-6 sm:right-10 z-[70] px-5 py-2.5 bg-[#030014]/80 backdrop-blur-xl border border-[#00F0FF]/30 text-[#00F0FF] rounded-xl font-black text-xs sm:text-sm shadow-2xl hover:bg-[#00F0FF] hover:text-[#05001A] hover:border-[#00F0FF] transition-all flex items-center gap-2 pointer-events-auto"
                    >
                        <FastForward className="w-4 h-4" /> تخطي النهاية
                    </motion.button>
                )}

            </AnimatePresence>
        </div>
    );

    return playerContent;
}
