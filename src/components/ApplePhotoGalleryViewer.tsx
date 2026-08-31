import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  Eye,
  EyeOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { idbGetVaultItem } from '../utils/indexedDbMediaVault';

export interface AppleGalleryItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'photo' | 'video' | 'image';
  title?: string;
  date?: string;
  created_at?: string;
  show_on_buddy?: boolean;
  is_favorite?: boolean;
  category?: string;
  coachNote?: string;
  likes?: number;
  rawBlob?: Blob | File;
}

interface ApplePhotoGalleryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  items: AppleGalleryItem[];
  initialIndex?: number;
  ownerName?: string;
  onToggleBuddy?: (item: AppleGalleryItem) => void;
  onDelete?: (item: AppleGalleryItem) => void;
  onToggleFavorite?: (item: AppleGalleryItem) => void;
}

// Convert data URL (Base64) or Blob to ObjectURL for hardware video decoding & byte-range seeking
function getPlayableVideoSrc(rawUrl: string, rawBlob?: Blob | File): { src: string; isBlobUrl: boolean } {
  if (rawBlob) {
    try {
      return { src: URL.createObjectURL(rawBlob), isBlobUrl: true };
    } catch {
      // ignore
    }
  }
  if (!rawUrl) return { src: '', isBlobUrl: false };
  if (rawUrl.startsWith('data:video/')) {
    try {
      const parts = rawUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return { src: URL.createObjectURL(blob), isBlobUrl: true };
    } catch {
      return { src: rawUrl, isBlobUrl: false };
    }
  }
  return { src: rawUrl, isBlobUrl: false };
}

export const ApplePhotoGalleryViewer: React.FC<ApplePhotoGalleryViewerProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  onToggleBuddy,
  onDelete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [localBuddyState, setLocalBuddyState] = useState<Record<string, boolean>>({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);

  // Video Player State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Default muted so mobile browsers allow seamless autoplay
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDeltaRef = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(items.length - 1, initialIndex)));
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      setShowControls(true);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
      setHasPlaybackError(false);
      setShowDeletePrompt(false);
    }
  }, [isOpen, initialIndex, items.length]);

  const currentItem = items[currentIndex] || items[0];
  const isVideo = currentItem?.type === 'video';

  // Manage playable video URL and blob cleanup
  const [videoSrc, setVideoSrc] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !isVideo || !currentItem) {
      setVideoSrc('');
      return;
    }

    let isMounted = true;
    let activeCreatedBlobUrl = '';

    const resolveSrc = async () => {
      let candidateUrl = currentItem.url;
      let candidateBlob = currentItem.rawBlob;

      // If missing video URL, attempt fetch from IndexedDB
      if (!candidateUrl && !candidateBlob) {
        try {
          const stored = await idbGetVaultItem(currentItem.id);
          if (stored) {
            candidateUrl = stored.url;
            candidateBlob = stored.rawBlob;
          }
        } catch {
          // ignore
        }
      }

      if (!isMounted) return;

      const { src, isBlobUrl } = getPlayableVideoSrc(candidateUrl, candidateBlob);
      if (isBlobUrl) {
        activeCreatedBlobUrl = src;
      }
      setVideoSrc(src);
      setHasPlaybackError(false);
      setCurrentTime(0);
      setDuration(0);
    };

    resolveSrc();

    return () => {
      isMounted = false;
      if (activeCreatedBlobUrl && activeCreatedBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeCreatedBlobUrl);
      }
    };
  }, [isOpen, isVideo, currentItem?.id, currentItem?.url, currentItem?.rawBlob]);

  // Handle Video Autoplay when videoSrc is ready
  useEffect(() => {
    if (!isOpen || !isVideo || !videoSrc || !videoRef.current) return;
    const video = videoRef.current;
    video.currentTime = 0;
    
    // Attempt play
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // If browser policy blocked unmuted, mute and retry
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            const retry = videoRef.current.play();
            if (retry !== undefined) {
              retry
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
          }
        });
    }
  }, [videoSrc, isOpen, isVideo]);

  // Lock background scroll & handle keyboard
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeletePrompt) {
          setShowDeletePrompt(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleNativeFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleVideoPlayback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, currentIndex, items.length, showDeletePrompt]);

  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      setIsPlaying(true);
      setCurrentTime(0);
      setShowDeletePrompt(false);
    }
  }, [currentIndex, items.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      setIsPlaying(true);
      setCurrentTime(0);
      setShowDeletePrompt(false);
    }
  }, [currentIndex]);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any)?.webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  const toggleVideoPlayback = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          }
        });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStageClick = () => {
    if (showDeletePrompt) {
      setShowDeletePrompt(false);
      return;
    }
    if (isVideo) {
      toggleVideoPlayback();
      return;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      setZoomLevel((prev) => (prev > 1 ? 1 : 2.2));
      setPanOffset({ x: 0, y: 0 });
    } else {
      setShowControls((prev) => !prev);
    }
    lastTapRef.current = now;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      dragDeltaRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (zoomLevel > 1) {
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;
      setPanOffset((prev) => ({ x: prev.x + deltaX * 0.1, y: prev.y + deltaY * 0.1 }));
      return;
    }
    if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        dragDeltaRef.current = deltaX;
        setDragOffset(deltaX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (zoomLevel > 1) return;
    const threshold = 60;
    if (dragDeltaRef.current < -threshold && currentIndex < items.length - 1) {
      goToNext();
    } else if (dragDeltaRef.current > threshold && currentIndex > 0) {
      goToPrev();
    }
    setDragOffset(0);
    dragDeltaRef.current = 0;
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newFraction = clickX / rect.width;
    const newTime = newFraction * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const executeDelete = () => {
    if (!onDelete || !currentItem) return;
    setShowDeletePrompt(false);
    onDelete(currentItem);
    if (items.length <= 1) {
      onClose();
    } else if (currentIndex >= items.length - 1) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
  };

  if (!isOpen || items.length === 0 || !currentItem) return null;

  const dateFormatted = currentItem.created_at
    ? new Date(currentItem.created_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : currentItem.date || '';

  const timeFormatted = currentItem.created_at
    ? new Date(currentItem.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isBuddyActive = localBuddyState[currentItem.id] !== undefined
    ? localBuddyState[currentItem.id]
    : !!currentItem.show_on_buddy;

  const galleryUi = (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center select-none overflow-hidden touch-none font-sans ${
        isFullscreen ? 'w-screen h-screen' : ''
      }`}
    >
      {/* ─── NUDE / BARE TOP RIGHT CONTROLS ─── */}
      <div
        className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleNativeFullscreen();
          }}
          className="w-9 h-9 flex items-center justify-center text-white/90 hover:text-white active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
          aria-label="Toggle Fullscreen"
          title="Full Screen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 stroke-[2]" />
          ) : (
            <Maximize2 className="w-5 h-5 stroke-[2]" />
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-9 h-9 flex items-center justify-center text-white/90 hover:text-white active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
          aria-label="Close"
          title="Close Viewer"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* ─── TOP LEFT DATE & METADATA ─── */}
      {dateFormatted && (
        <div
          className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-40 flex flex-col pointer-events-none transition-opacity duration-200 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-white/90 text-[11px] font-semibold tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {dateFormatted}
          </span>
          {timeFormatted && (
            <span className="text-white/60 font-mono text-[9px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {timeFormatted}
            </span>
          )}
        </div>
      )}

      {/* ─── MAIN PHOTO / VIDEO STAGE ─── */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={handleStageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Arrow (Desktop hover) */}
        {currentIndex > 0 && showControls && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="hidden md:flex absolute left-4 z-40 w-10 h-10 text-white/80 hover:text-white active:scale-90 items-center justify-center transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
            aria-label="Previous Media"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2]" />
          </button>
        )}

        {/* Media Container */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
          style={{
            transform: `translateX(${dragOffset}px) translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {videoSrc ? (
                <video
                  ref={videoRef}
                  key={currentItem.id}
                  src={videoSrc}
                  playsInline
                  autoPlay
                  preload="auto"
                  controls={false}
                  muted={isMuted}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.duration && !isNaN(v.duration)) {
                      setDuration(v.duration);
                    }
                  }}
                  onLoadedData={(e) => {
                    const v = e.currentTarget;
                    if (v.duration && !isNaN(v.duration)) {
                      setDuration(v.duration);
                    }
                    setHasPlaybackError(false);
                  }}
                  onTimeUpdate={(e) => {
                    setCurrentTime(e.currentTarget.currentTime);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => {
                    setHasPlaybackError(true);
                  }}
                  className="max-w-full max-h-full object-contain"
                />
              ) : null}

              {/* Big Center Play Glyph when paused */}
              {!isPlaying && !hasPlaybackError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Play className="w-14 h-14 text-white/90 fill-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
                </div>
              )}

              {/* Fallback image if video fails */}
              {hasPlaybackError && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-white/70">
                  {currentItem.thumbnailUrl ? (
                    <img
                      src={currentItem.thumbnailUrl}
                      alt="Thumbnail"
                      className="max-w-full max-h-[60vh] object-contain rounded-xl opacity-70 mb-3"
                    />
                  ) : null}
                  <p className="text-xs font-mono">Video preview unavailable on this device</p>
                </div>
              )}
            </div>
          ) : (
            <img
              key={currentItem.id}
              src={currentItem.url || currentItem.thumbnailUrl}
              alt={currentItem.title || 'Vault Media'}
              className="max-w-full max-h-full object-contain select-none transition-transform duration-100"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLElement).style.opacity = '0.5';
              }}
            />
          )}
        </div>

        {/* Right Arrow (Desktop hover) */}
        {currentIndex < items.length - 1 && showControls && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="hidden md:flex absolute right-4 z-40 w-10 h-10 text-white/80 hover:text-white active:scale-90 items-center justify-center transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
            aria-label="Next Media"
          >
            <ChevronRight className="w-6 h-6 stroke-[2]" />
          </button>
        )}
      </div>

      {/* ─── SLEEK MINIMALIST VIDEO TIMELINE ─── */}
      {isVideo && (
        <div
          className={`absolute bottom-14 inset-x-3 sm:inset-x-6 z-50 flex flex-col gap-1.5 transition-opacity duration-200 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Hairline Scrub Bar */}
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="w-full h-3 flex items-center cursor-pointer group"
          >
            <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden relative group-hover:h-1.5 transition-all">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Time & Play/Pause on Left + Volume at FAR RIGHT */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVideoPlayback}
                className="w-7 h-7 text-white/90 hover:text-white active:scale-90 flex items-center justify-center transition-all cursor-pointer drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 stroke-[2]" />
                ) : (
                  <Play className="w-4 h-4 stroke-[2] fill-white ml-0.5" />
                )}
              </button>
              <span className="text-white/90 font-mono text-[11px] tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                }
                setIsMuted((prev) => !prev);
              }}
              className="w-7 h-7 text-white/90 hover:text-white active:scale-90 flex items-center justify-center transition-all cursor-pointer drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 stroke-[2]" />
              ) : (
                <Volume2 className="w-4 h-4 stroke-[2]" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── REFINED APPLE PRO BOTTOM BAR (NUDE / BARE BUTTONS) ─── */}
      <div
        className={`absolute bottom-4 sm:bottom-5 inset-x-0 z-[60] flex items-center justify-between px-4 sm:px-6 pointer-events-auto transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Buddy Visibility Toggle */}
        {onToggleBuddy ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const nextVal = !isBuddyActive;
              setLocalBuddyState((prev) => ({ ...prev, [currentItem.id]: nextVal }));
              onToggleBuddy({ ...currentItem, show_on_buddy: nextVal });
            }}
            className={`w-9 h-9 flex items-center justify-center active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] ${
              isBuddyActive ? 'text-red-500' : 'text-white/80 hover:text-white'
            }`}
            title={isBuddyActive ? 'Visible on Buddy Card' : 'Hidden from Buddy Card'}
            aria-label="Toggle Buddy Visibility"
          >
            {isBuddyActive ? (
              <Eye className="w-5 h-5 stroke-[2]" />
            ) : (
              <EyeOff className="w-5 h-5 stroke-[2]" />
            )}
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}

        {/* Delete Button */}
        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeletePrompt(true);
            }}
            className="w-9 h-9 text-white/80 hover:text-red-400 active:scale-90 flex items-center justify-center transition-all cursor-pointer drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="w-5 h-5 stroke-[1.75]" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </div>

      {/* ─── APPLE PRO INLINE DELETION ACTION SHEET (NO BLOCKED WINDOW.CONFIRM) ─── */}
      {showDeletePrompt && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeletePrompt(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#181B22] border border-neutral-200 dark:border-white/15 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150 text-center text-zinc-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-9 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Delete {isVideo ? 'Video' : 'Photo'}?</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                This media will be permanently removed from your vault.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeletePrompt(false)}
                className="flex-1 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-mono text-xs font-bold cursor-pointer transition-all active:scale-95 border border-neutral-200 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-red-900/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(galleryUi, document.body) : galleryUi;
};
