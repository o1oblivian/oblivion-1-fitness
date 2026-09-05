import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  PenTool,
  CornerDownLeft,
  Check,
  Send,
  Sparkles,
  Layers,
  Compass,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface FormCheckTelestratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteName: string;
  videoUrl?: string;
  exerciseTitle?: string;
  athleteNotes?: string;
  onSendFeedback?: (feedback: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

type ToolMode = 'barPath' | 'jointAngle' | 'highlight' | 'eraser';

interface DrawPoint {
  x: number;
  y: number;
}

interface Stroke {
  tool: ToolMode;
  color: string;
  points: DrawPoint[];
}

export const FormCheckTelestratorModal: React.FC<FormCheckTelestratorModalProps> = ({
  isOpen,
  onClose,
  athleteName,
  videoUrl,
  exerciseTitle = 'Barbell Squat / Form Check',
  athleteNotes,
  onSendFeedback,
  showToast,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<0.25 | 0.5 | 1>(1);
  const [activeTool, setActiveTool] = useState<ToolMode>('barPath');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suggested high-impact biomechanical cues
  const COACH_CUES = [
    'Lock lats & brace 360° before initiation',
    'Bar path drifting forward at bottom reversal',
    'Drive floor away through midfoot triangle',
    'Maintain neutral cervical/lumbar alignment',
  ];

  // Tool colors
  const getToolColor = (tool: ToolMode) => {
    switch (tool) {
      case 'barPath':
        return '#EF4444'; // OFC Red
      case 'jointAngle':
        return '#10B981'; // Emerald
      case 'highlight':
        return '#F59E0B'; // Amber
      default:
        return '#FFFFFF';
    }
  };

  // Sync canvas size with video client rect
  const syncCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const rect = video.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawStrokes(strokes);
    }
  }, [strokes]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [isOpen, syncCanvasSize]);

  // Redraw all strokes onto canvas
  const redrawStrokes = (currentStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of currentStrokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.tool === 'highlight' ? 6 : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlight') {
        ctx.globalAlpha = 0.5;
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();

      // If bar path, draw arrowhead at the final point
      if (stroke.tool === 'barPath' && stroke.points.length >= 2) {
        const last = stroke.points[stroke.points.length - 1];
        const prev = stroke.points[stroke.points.length - 2];
        const angle = Math.atan2(last.y - prev.y, last.x - prev.x);

        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Video playback controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    haptic.tap();
  };

  const handleRateChange = (rate: 0.25 | 0.5 | 1) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    haptic.tap();
  };

  const stepFrame = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + deltaSeconds));
    haptic.tap();
  };

  // Canvas drawing handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pause video while drawing
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    const newStroke: Stroke = {
      tool: activeTool,
      color: getToolColor(activeTool),
      points: [{ x, y }],
    };

    setStrokes((prev) => [...prev, newStroke]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      const lastStroke = { ...updated[lastIndex] };
      lastStroke.points = [...lastStroke.points, { x, y }];
      updated[lastIndex] = lastStroke;
      redrawStrokes(updated);
      return updated;
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    haptic.tap();
    setStrokes((prev) => {
      const next = prev.slice(0, -1);
      redrawStrokes(next);
      return next;
    });
  };

  const handleClear = () => {
    haptic.tap();
    setStrokes([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      showToast?.('Please enter coach feedback or select a cue', 'error');
      return;
    }

    setIsSubmitting(true);
    haptic.thump();

    setTimeout(() => {
      if (onSendFeedback) {
        onSendFeedback(feedbackText);
      }
      showToast?.(`Biomechanical feedback dispatched to ${athleteName}`, 'success');
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Compass className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white tracking-wide truncate">
                Telestrator Form Check • {athleteName}
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono truncate">{exerciseTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Stage with Canvas Overlay */}
        <div className="relative w-full bg-black aspect-video flex items-center justify-center select-none overflow-hidden touch-none">
          <video
            ref={videoRef}
            src={videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-in-the-gym-40504-large.mp4'}
            playsInline
            onLoadedData={syncCanvasSize}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Telestrator Drawing Layer */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="absolute inset-0 w-full h-full cursor-crosshair z-10"
          />

          {/* Floating Speed & Tool Indicator */}
          <div className="absolute top-2 left-2 z-20 pointer-events-none flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-zinc-300">
              {playbackRate}x
            </span>
            {strokes.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-[9px] font-mono text-red-400">
                {strokes.length} annotations
              </span>
            )}
          </div>
        </div>

        {/* Playback & Telestrator Tool Bar */}
        <div className="p-3 bg-zinc-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Video Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button
              onClick={() => stepFrame(-0.05)}
              title="Previous Frame"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <SkipBack className="w-3 h-3" />
            </button>
            <button
              onClick={() => stepFrame(0.05)}
              title="Next Frame"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <SkipForward className="w-3 h-3" />
            </button>

            {/* Slow-mo Speed selector */}
            <div className="flex items-center rounded-lg bg-white/5 p-0.5 border border-white/10 ml-1">
              {([0.25, 0.5, 1] as const).map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition-colors cursor-pointer ${
                    playbackRate === rate ? 'bg-white/20 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Telestrator Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTool('barPath');
                haptic.tap();
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                activeTool === 'barPath'
                  ? 'bg-red-500/20 border-red-500/40 text-red-400 font-bold'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Bar Path
            </button>

            <button
              onClick={() => {
                setActiveTool('jointAngle');
                haptic.tap();
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                activeTool === 'jointAngle'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Joint Angle
            </button>

            <button
              onClick={() => {
                setActiveTool('highlight');
                haptic.tap();
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                activeTool === 'highlight'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold'
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Kinetic Dot
            </button>

            <div className="h-4 w-px bg-white/10 mx-0.5" />

            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Undo last stroke"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClear}
              disabled={strokes.length === 0}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Clear all strokes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Athlete Note & Quick Coach Cues */}
        <div className="p-3.5 space-y-2.5 overflow-y-auto max-h-52 bg-zinc-950">
          {athleteNotes && (
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-zinc-300">
              <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[9px] block mb-0.5">
                Athlete Note
              </span>
              &ldquo;{athleteNotes}&rdquo;
            </div>
          )}

          {/* Quick Coach Cues Chips */}
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              Rapid Biomechanical Cues
            </span>
            <div className="flex flex-wrap gap-1">
              {COACH_CUES.map((cue) => (
                <button
                  key={cue}
                  onClick={() => {
                    setFeedbackText((prev) => (prev ? `${prev} • ${cue}` : cue));
                    haptic.tap();
                  }}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 text-[10px] font-mono transition-colors text-left cursor-pointer active:scale-95"
                >
                  + {cue}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback input & dispatch */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Add coaching cue or telemetry assessment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
            />
            <button
              onClick={handleSendFeedback}
              disabled={isSubmitting || !feedbackText.trim()}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
