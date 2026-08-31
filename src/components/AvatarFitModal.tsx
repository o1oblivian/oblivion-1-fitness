import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X, ZoomIn, ZoomOut, RotateCw, Crop, Maximize2 } from 'lucide-react';

interface AvatarFitModalProps {
  isOpen: boolean;
  imageSrc: string;
  onApply: (croppedDataUrl: string) => void;
  onClose: () => void;
}

type Shape = 'circle' | 'square';

const CONTAINER_SIZE = 280;
const OUTPUT_SIZE = 512;

export const AvatarFitModal: React.FC<AvatarFitModalProps> = ({
  isOpen,
  imageSrc,
  onApply,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [shape, setShape] = useState<Shape>('circle');
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setShape('circle');
      setIsSaving(false);
      setLoadedImg(null);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setLoadedImg(img);
      img.onerror = () => setLoadedImg(null);
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const imgCoverScale = useCallback(() => {
    if (!loadedImg) return 1;
    const iw = loadedImg.naturalWidth;
    const ih = loadedImg.naturalHeight;
    return Math.max(CONTAINER_SIZE / iw, CONTAINER_SIZE / ih);
  }, [loadedImg]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const maxOffset = (CONTAINER_SIZE / 2) * (zoom - 1) + 60;
    setOffset({
      x: clamp(dragStart.current.offsetX + dx, -maxOffset, maxOffset),
      y: clamp(dragStart.current.offsetY + dy, -maxOffset, maxOffset),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleSave = useCallback(() => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const img = loadedImg;
      if (!img) {
        onApply(imageSrc);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onApply(imageSrc);
        return;
      }

      ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      if (shape === 'circle') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      const baseScale = imgCoverScale();
      const exportRatio = OUTPUT_SIZE / CONTAINER_SIZE;
      const scaledW = img.naturalWidth * baseScale * zoom * exportRatio;
      const scaledH = img.naturalHeight * baseScale * zoom * exportRatio;
      const cx = OUTPUT_SIZE / 2 + offset.x * exportRatio;
      const cy = OUTPUT_SIZE / 2 + offset.y * exportRatio;

      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);

      if (shape === 'circle') ctx.restore();

      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      } catch {
        dataUrl = imageSrc;
      }

      onApply(dataUrl);
    } catch {
      onApply(imageSrc);
    }
  }, [isSaving, loadedImg, imageSrc, shape, zoom, rotation, offset, imgCoverScale, onApply]);

  if (!isOpen) return null;

  const coverScale = imgCoverScale();

  return (
    <div className="fixed inset-0 z-[150] bg-white dark:bg-[#121414] overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121414] w-full h-full min-h-screen shadow-2xl border border-[rgba(0,0,0,0.08)] dark:border-[#2A2E2D] flex flex-col animate-slideDownFade">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)] dark:border-[#2A2E2D]">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-zinc-500" />
            <h2 className="text-sm font-display font-black tracking-tight text-[#000000] dark:text-[#FFFFFF]">
              Fit Profile Photo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Preview */}
        <div className="px-5 py-5 flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden bg-slate-200 dark:bg-slate-800 select-none touch-none cursor-grab"
            style={{
              width: CONTAINER_SIZE,
              height: CONTAINER_SIZE,
              borderRadius: shape === 'circle' ? '9999px' : '20px',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {loadedImg && (
              <img
                src={imageSrc}
                alt="Fit preview"
                draggable={false}
                className="absolute pointer-events-none will-change-transform"
                style={{
                  width: loadedImg.naturalWidth * coverScale,
                  height: loadedImg.naturalHeight * coverScale,
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.08s linear',
                }}
              />
            )}
            {/* Grid overlay for square */}
            {shape === 'square' && (
              <div className="absolute inset-0 pointer-events-none border border-white/20">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/10" />
                  ))}
                </div>
              </div>
            )}
            {/* Drag hint */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/80 bg-black/40 px-1.5 py-0.5 rounded-full pointer-events-none">
              Drag to reposition
            </div>
          </div>

          {/* Shape toggle */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mr-1">Shape</span>
            <button
              onClick={() => setShape('circle')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                shape === 'circle'
                  ? 'bg-zinc-500 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              Circle
            </button>
            <button
              onClick={() => setShape('square')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                shape === 'square'
                  ? 'bg-zinc-500 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              Square
            </button>
          </div>

          {/* Zoom slider */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">Zoom</span>
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => clamp(+(z - 0.1).toFixed(2), 1, 3))}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(+e.target.value)}
                className="flex-1 accent-stone-500 cursor-pointer"
              />
              <button
                onClick={() => setZoom((z) => clamp(+(z + 0.1).toFixed(2), 1, 3))}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rotation + reset */}
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Rotate 90
            </button>
            <button
              onClick={() => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); }}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Sticky footer actions */}
        <div className="sticky bottom-0 p-4 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10 bg-white dark:bg-[#0A0C10] flex items-center gap-3 mt-auto">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-neutral-400 font-bold text-xs transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-[2] py-3 rounded-2xl bg-zinc-500 hover:bg-stone-400 disabled:opacity-60 text-black font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-stone-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSaving ? 'Saving...' : 'Done'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
