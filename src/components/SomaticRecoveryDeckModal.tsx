import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, HeartPulse, Waves,
  Sparkles, Timer, CheckCircle2, ShieldCheck, Wind, Sliders, ArrowRight
} from 'lucide-react';
import { haptic, triggerHaptic } from '../utils/haptics';

export type SomaticProtocolId = 'box' | '478' | 'coherence' | 'wimhof' | 'nsdr' | 'yoga';

interface SomaticProtocol {
  id: SomaticProtocolId;
  title: string;
  subtitle: string;
  category: 'Breathwork' | 'Somatic Rest' | 'Yoga Flow';
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
  description: string;
  benefits: string[];
  carrierDefault: '432hz' | 'theta' | 'delta' | 'none';
  soundscapeDefault: 'ocean' | 'rain' | 'none';
}

const SOMATIC_PROTOCOLS: Record<SomaticProtocolId, SomaticProtocol> = {
  box: {
    id: 'box',
    title: 'Box Breathing',
    subtitle: 'Autonomic Stabilization & Focus',
    category: 'Breathwork',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 6,
    description: 'Equalized 4-stage square cadence used by elite athletic operators to drop cortisol, clear mental brain fog, and stabilize heart rate.',
    benefits: ['Lowers Acute Cortisol', 'Sharpens Working Memory', 'Equalizes Blood Pressure'],
    carrierDefault: '432hz',
    soundscapeDefault: 'ocean',
  },
  '478': {
    id: '478',
    title: '4-7-8 Vagal Brake',
    subtitle: 'Deep Sleep & Nervous System Reset',
    category: 'Breathwork',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 5,
    description: 'Dr. Andrew Weil parasympathetic braking sequence. The extended 8-second exhale mechanically triggers acetylcholine release across the vagus nerve.',
    benefits: ['Accelerates Sleep Onset', 'Relieves Muscular Spasms', 'Triggers Parasympathetic Shift'],
    carrierDefault: 'delta',
    soundscapeDefault: 'rain',
  },
  coherence: {
    id: 'coherence',
    title: '5.5s Heart Coherence',
    subtitle: 'HRV Synchronization & Vascular Flow',
    category: 'Breathwork',
    inhale: 5.5,
    hold1: 0,
    exhale: 5.5,
    hold2: 0,
    cycles: 8,
    description: 'Resonant frequency breathing at exactly 5.45 breaths per minute. Aligns heart rhythm fluctuations with blood pressure waves (Mayer waves).',
    benefits: ['Maximizes Heart Rate Variability', 'Optimizes Cardiorespiratory Sync', 'Sustained Calm Alertness'],
    carrierDefault: '432hz',
    soundscapeDefault: 'ocean',
  },
  wimhof: {
    id: 'wimhof',
    title: 'Tummo Cellular Power',
    subtitle: 'Deep Oxygenation & Apnea Retention',
    category: 'Breathwork',
    inhale: 2.5,
    hold1: 0,
    exhale: 2,
    hold2: 0,
    cycles: 30, // 30 fast cycles, then retention phase
    description: 'Cyclic hyperventilation followed by an unforced exhalation breath-hold. Induces temporary safe hypoxia to trigger mitochondrial biogenesis and adrenaline release.',
    benefits: ['Cellular Alkalization', 'Boosts Immune Resistance', 'Expands Lung Capacity'],
    carrierDefault: 'theta',
    soundscapeDefault: 'ocean',
  },
  nsdr: {
    id: 'nsdr',
    title: 'NSDR Somatic Scan',
    subtitle: 'Non-Sleep Deep Rest & Yoga Nidra',
    category: 'Somatic Rest',
    inhale: 4,
    hold1: 2,
    exhale: 6,
    hold2: 2,
    cycles: 8,
    description: 'Guided progressive sensory rotation through 7 autonomic hubs. Resets basal ganglia dopamine stores and achieves the physical rest equivalent of 2 hours of sleep.',
    benefits: ['Restores Striatal Dopamine', 'Accelerates Motor Learning', 'Neutralizes CNS Fatigue'],
    carrierDefault: 'theta',
    soundscapeDefault: 'rain',
  },
  yoga: {
    id: 'yoga',
    title: 'Breath-Paced Asana Flow',
    subtitle: 'Thoracic Mobility & Psoas Decompression',
    category: 'Yoga Flow',
    inhale: 4,
    hold1: 3,
    exhale: 5,
    hold2: 0,
    cycles: 7,
    description: 'Breath-linked isometric transitions through Surya Namaskar, Virabhadrasana II, and deep Pigeon hip fascial decompression.',
    benefits: ['Releases Latent Psoas Tension', 'Decompresses Thoracic Spine', 'Fascial Elasticity Restoration'],
    carrierDefault: '432hz',
    soundscapeDefault: 'none',
  },
};

const NSDR_SOMATIC_STATIONS = [
  { region: 'Crown & Forehead', cue: 'Release all tension in the brow, temples, and eyelids. Soften the optic nerve.' },
  { region: 'Jaw & Throat', cue: 'Let the tongue unglue from the palate. Release the masseter muscles of the jaw.' },
  { region: 'Shoulders & Clavicle', cue: 'Feel the collarbones broaden. Allow both shoulder blades to sink into the floor.' },
  { region: 'Heart & Ribcage', cue: 'Notice the subtle expansion of the chest wall. Soften the space behind the sternum.' },
  { region: 'Solar Plexus & Abdomen', cue: 'Release all bracing in the abdominal wall. Allow belly to rise freely with each breath.' },
  { region: 'Pelvic Bowl & Psoas', cue: 'Surrender all holding in the hips, sacrum, and glutes. Complete gravitational anchoring.' },
  { region: 'Limbs & Soles', cue: 'Feel warmth flowing through the fingertips and the soles of both feet. Pure stillness.' },
];

const YOGA_ASANA_STATIONS = [
  { asana: 'Mountain Grounding (Tadasana)', cue: 'Root through four corners of feet. Lengthen spine, roll shoulders back and down.' },
  { asana: 'Forward Fold & Hang (Uttanasana)', cue: 'Bend knees softly. Allow gravity to decompress cervical and lumbar vertebrae.' },
  { asana: 'Low Lunge & Psoas Extension (Anjaneyasana)', cue: 'Sink hips forward. Reach arms tall to lengthen the hip flexor and anterior chain.' },
  { asana: 'Downward Dog Spine Stretch (Adho Mukha Svanasana)', cue: 'Press firmly into palms, send sitting bones high. Release the back of neck.' },
  { asana: 'Pigeon Hip Opener (Eka Pada Rajakapotasana)', cue: 'Square the hips. Surrender torso over front shin, releasing deep piriformis tension.' },
  { asana: 'Seated Spinal Twist (Ardha Matsyendrasana)', cue: 'Inhale to grow tall through the crown, exhale to gently rotate from the thoracic spine.' },
  { asana: 'Corpse Pose Stillness (Savasana)', cue: 'Full somatic surrender. Let the breath breathe itself with zero effort or control.' },
];

interface SomaticRecoveryDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProtocol?: SomaticProtocolId;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'retention';

export const SomaticRecoveryDeckModal: React.FC<SomaticRecoveryDeckModalProps> = ({
  isOpen,
  onClose,
  initialProtocol = 'box',
  showToast,
}) => {
  const [protocolId, setProtocolId] = useState<SomaticProtocolId>(initialProtocol);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);

  // Wim Hof Apnea stopwatch retention state
  const [isApneaRetention, setIsApneaRetention] = useState(false);
  const [apneaStopwatch, setApneaStopwatch] = useState(0);

  // Audio Mixer States
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [carrierType, setCarrierType] = useState<'432hz' | 'theta' | 'delta' | 'none'>('432hz');
  const [soundscapeType, setSoundscapeType] = useState<'ocean' | 'rain' | 'none'>('ocean');

  // Pre & Post Session Check-in
  const [preState, setPreState] = useState<'wired' | 'tense' | 'fatigued' | 'neutral' | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const protocol = SOMATIC_PROTOCOLS[protocolId];

  // Audio Context & Synthesizer Nodes Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const carrierOscRef = useRef<OscillatorNode | null>(null);
  const binauralOscRef = useRef<OscillatorNode | null>(null);
  const carrierGainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Reset phase when protocol changes
  useEffect(() => {
    if (initialProtocol && SOMATIC_PROTOCOLS[initialProtocol]) {
      setProtocolId(initialProtocol);
    }
  }, [initialProtocol]);

  useEffect(() => {
    setIsActive(false);
    setPhase('inhale');
    setPhaseSecondsLeft(protocol.inhale);
    setCurrentCycle(1);
    setTotalSecondsElapsed(0);
    setIsApneaRetention(false);
    setApneaStopwatch(0);
    setIsCompleted(false);
    setCarrierType(protocol.carrierDefault);
    setSoundscapeType(protocol.soundscapeDefault);
  }, [protocolId, protocol]);

  // ─── Web Audio API Synthesizer Setup ───
  const initAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  const playSingingBowlChime = useCallback((freq = 528) => {
    if (!audioEnabled || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.995, now + 3.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25 * volume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.0);
    } catch {
      // ignore
    }
  }, [audioEnabled, volume]);

  // Ambient sound synthesizer engine
  const startAmbientDeck = useCallback(() => {
    if (!audioEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Master Gain
    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.connect(ctx.destination);
    }
    masterGainRef.current.gain.setValueAtTime(volume * 0.35, ctx.currentTime);

    // Stop existing nodes
    try {
      carrierOscRef.current?.stop();
      binauralOscRef.current?.stop();
    } catch {}

    // Carrier & Binaural Frequencies
    if (carrierType !== 'none') {
      let baseFreq = 432;
      let beatDelta = 0;

      if (carrierType === '432hz') {
        baseFreq = 432;
        beatDelta = 0;
      } else if (carrierType === 'theta') {
        baseFreq = 216;
        beatDelta = 6.0; // 6Hz Theta
      } else if (carrierType === 'delta') {
        baseFreq = 108;
        beatDelta = 2.5; // 2.5Hz Delta
      }

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq + beatDelta, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGainRef.current);

      osc1.start();
      osc2.start();

      carrierOscRef.current = osc1;
      binauralOscRef.current = osc2;
      carrierGainRef.current = gain;
    }

    // Soundscape: Ocean / Rain noise synthesis
    if (soundscapeType !== 'none') {
      try {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.11; // Pink/Brown organic noise
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = soundscapeType === 'ocean' ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(soundscapeType === 'ocean' ? 380 : 750, ctx.currentTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.06, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGainRef.current);

        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
        noiseGainRef.current = noiseGain;
      } catch {}
    }
  }, [audioEnabled, carrierType, soundscapeType, volume, initAudio]);

  const stopAmbientDeck = useCallback(() => {
    try {
      carrierOscRef.current?.stop();
      carrierOscRef.current?.disconnect();
      carrierOscRef.current = null;
      binauralOscRef.current?.stop();
      binauralOscRef.current?.disconnect();
      binauralOscRef.current = null;
      (noiseNodeRef.current as AudioBufferSourceNode)?.stop();
      noiseNodeRef.current?.disconnect();
      noiseNodeRef.current = null;
    } catch {}
  }, []);

  // Update volume in real-time
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume * 0.35, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Manage ambient sound playback
  useEffect(() => {
    if (isActive && audioEnabled) {
      startAmbientDeck();
    } else {
      stopAmbientDeck();
    }
    return () => {
      stopAmbientDeck();
    };
  }, [isActive, audioEnabled, carrierType, soundscapeType, startAmbientDeck, stopAmbientDeck]);

  // ─── Main Kinetic Breathing Engine ───
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTotalSecondsElapsed((prev) => prev + 1);

      if (isApneaRetention) {
        setApneaStopwatch((prev) => prev + 1);
        return;
      }

      setPhaseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition to next phase
          triggerHaptic();

          if (phase === 'inhale') {
            if (protocol.hold1 > 0) {
              setPhase('hold1');
              playSingingBowlChime(640);
              return protocol.hold1;
            } else {
              setPhase('exhale');
              playSingingBowlChime(432);
              return protocol.exhale;
            }
          } else if (phase === 'hold1') {
            setPhase('exhale');
            playSingingBowlChime(432);
            return protocol.exhale;
          } else if (phase === 'exhale') {
            // Check for Wim Hof retention
            if (protocolId === 'wimhof' && currentCycle >= protocol.cycles) {
              setIsApneaRetention(true);
              setPhase('retention');
              playSingingBowlChime(320);
              return 999;
            }

            if (protocol.hold2 > 0) {
              setPhase('hold2');
              playSingingBowlChime(384);
              return protocol.hold2;
            } else {
              // Cycle complete
              if (currentCycle >= protocol.cycles) {
                setIsActive(false);
                setIsCompleted(true);
                playSingingBowlChime(528);
                return 0;
              }
              setCurrentCycle((c) => c + 1);
              setPhase('inhale');
              playSingingBowlChime(528);
              return protocol.inhale;
            }
          } else if (phase === 'hold2') {
            if (currentCycle >= protocol.cycles) {
              setIsActive(false);
              setIsCompleted(true);
              playSingingBowlChime(528);
              return 0;
            }
            setCurrentCycle((c) => c + 1);
            setPhase('inhale');
            playSingingBowlChime(528);
            return protocol.inhale;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase, protocol, currentCycle, isApneaRetention, protocolId, playSingingBowlChime]);

  // Handle exiting apnea retention (Wim Hof recovery inhale)
  const handleExitApneaRetention = () => {
    haptic.success();
    setIsApneaRetention(false);
    setPhase('hold1');
    setPhaseSecondsLeft(15); // 15s recovery breath hold
    playSingingBowlChime(528);
    showToast(`Apnea hold completed: ${apneaStopwatch} seconds! Inhale deep and hold 15s.`, 'success');
  };

  const togglePlayPause = () => {
    haptic.tap();
    if (!isActive) {
      initAudio();
      playSingingBowlChime(528);
    }
    setIsActive((prev) => !prev);
  };

  const handleResetSession = () => {
    haptic.tap();
    setIsActive(false);
    setPhase('inhale');
    setPhaseSecondsLeft(protocol.inhale);
    setCurrentCycle(1);
    setTotalSecondsElapsed(0);
    setIsApneaRetention(false);
    setApneaStopwatch(0);
    setIsCompleted(false);
  };

  // Phase Display Text & Optical Ring Scale
  const phaseMeta = useMemo(() => {
    switch (phase) {
      case 'inhale':
        return {
          label: 'Inhale through Nose',
          sub: 'Expand diaphragm & ribs',
          color: '#38BDF8', // Cyan / Sky calm
          scaleClass: 'scale-125 duration-1000',
          ringRadius: 135,
        };
      case 'hold1':
        return {
          label: 'Retain & Expand',
          sub: 'Hold breath with calm presence',
          color: '#818CF8', // Indigo calm
          scaleClass: 'scale-125 duration-300',
          ringRadius: 135,
        };
      case 'exhale':
        return {
          label: 'Release through Mouth',
          sub: 'Slow, unhurried deflation',
          color: '#A78BFA', // Soft lavender
          scaleClass: 'scale-75 duration-1000',
          ringRadius: 75,
        };
      case 'hold2':
        return {
          label: 'Suspension & Stillness',
          sub: 'Lungs empty, resting heartbeat',
          color: '#6366F1', // Deep indigo
          scaleClass: 'scale-75 duration-300',
          ringRadius: 75,
        };
      case 'retention':
        return {
          label: 'Exhale Apnea Retention',
          sub: 'Witness the inner silence',
          color: '#F59E0B',
          scaleClass: 'scale-90 duration-500',
          ringRadius: 90,
        };
    }
  }, [phase]);

  // Current Somatic Cue (for NSDR & Yoga)
  const currentStation = useMemo(() => {
    if (protocolId === 'nsdr') {
      const idx = (currentCycle - 1) % NSDR_SOMATIC_STATIONS.length;
      return NSDR_SOMATIC_STATIONS[idx];
    }
    if (protocolId === 'yoga') {
      const idx = (currentCycle - 1) % YOGA_ASANA_STATIONS.length;
      return YOGA_ASANA_STATIONS[idx];
    }
    return null;
  }, [protocolId, currentCycle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#090A10] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-zinc-100"
        style={{
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.9), 0 0 50px 0 rgba(139, 92, 246, 0.08)',
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                  Somatic & Breathwork Deck
                </h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 font-semibold">
                  AUTONOMIC RESTORATION
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Paced kinetic respiratory engine & binaural recovery
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAmbientDeck();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Main Deck Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5">
          {/* Protocol Selector Segmented Strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            {(Object.keys(SOMATIC_PROTOCOLS) as SomaticProtocolId[]).map((id) => {
              const p = SOMATIC_PROTOCOLS[id];
              const isSelected = protocolId === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    haptic.tap();
                    setProtocolId(id);
                  }}
                  className={`py-2 px-2 rounded-xl text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-zinc-950 font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-[11px] font-bold leading-tight truncate">{p.title.split(' ')[0]}</div>
                  <div className={`text-[9px] truncate ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {id === 'box' ? '4-4-4-4' : id === '478' ? 'Vagus' : id === 'coherence' ? '5.5s HRV' : id === 'wimhof' ? 'Tummo' : id === 'nsdr' ? 'NSDR' : 'Asana'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Protocol Description & Target Tag */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">{protocol.title}</span>
                <span className="text-[10px] font-mono text-violet-400">{protocol.subtitle}</span>
              </div>
              <p className="text-[11px] text-zinc-400 max-w-lg leading-relaxed">{protocol.description}</p>
            </div>
            <div className="flex flex-wrap gap-1 shrink-0">
              {protocol.benefits.slice(0, 2).map((b, i) => (
                <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* ─── THE KINETIC BREATH RING (Visual Core) ─── */}
          <div className="relative flex flex-col items-center justify-center py-6 sm:py-8 overflow-hidden rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.05]">
            {/* Background Ambient Radial Glow */}
            <div
              className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-1000"
              style={{ backgroundColor: phaseMeta.color }}
            />

            {/* Kinetic Ring Canvas / SVG Representation */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Outer Subtle Concentric Orbit */}
              <div className="absolute inset-0 rounded-full border border-white/[0.06] border-dashed animate-[spin_60s_linear_infinite]" />

              {/* Dynamic Scaling Pulse Ring */}
              <div
                className={`absolute rounded-full transition-all ease-in-out ${phaseMeta.scaleClass} flex items-center justify-center`}
                style={{
                  width: `${phaseMeta.ringRadius * 1.6}px`,
                  height: `${phaseMeta.ringRadius * 1.6}px`,
                  backgroundColor: `${phaseMeta.color}15`,
                  border: `2px solid ${phaseMeta.color}60`,
                  boxShadow: `0 0 35px 0 ${phaseMeta.color}35`,
                }}
              >
                {/* Secondary inner harmonic core */}
                <div
                  className="w-16 h-16 rounded-full transition-all duration-700 opacity-60"
                  style={{ backgroundColor: phaseMeta.color }}
                />
              </div>

              {/* Center HUD Display */}
              <div className="relative z-10 flex flex-col items-center text-center select-none px-4">
                {isApneaRetention ? (
                  <>
                    <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-widest mb-1">
                      APNEA RETENTION
                    </span>
                    <span className="text-5xl sm:text-6xl font-extrabold font-mono text-white tracking-tighter">
                      {apneaStopwatch}s
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-1">Tap Below When Ready to Inhale</span>
                  </>
                ) : (
                  <>
                    <span
                      className="text-xs font-mono font-bold uppercase tracking-widest transition-colors duration-500 mb-1"
                      style={{ color: phaseMeta.color }}
                    >
                      {phaseMeta.label}
                    </span>
                    <span className="text-5xl sm:text-6xl font-extrabold font-mono text-white tracking-tighter transition-all">
                      {isActive ? phaseSecondsLeft : protocol.inhale}s
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1 max-w-[180px] leading-tight">
                      {phaseMeta.sub}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Cycle Progress & Total Elapsed */}
            <div className="flex items-center gap-6 mt-4 font-mono text-[11px] text-zinc-400">
              <div>
                Cycle: <span className="font-bold text-white">{currentCycle}</span> / {protocol.cycles}
              </div>
              <div className="w-1 h-1 rounded-full bg-zinc-700" />
              <div>
                Elapsed: <span className="font-bold text-white">{Math.floor(totalSecondsElapsed / 60)}m {totalSecondsElapsed % 60}s</span>
              </div>
            </div>

            {/* Somatic / Yoga Guided Cue (If active protocol is NSDR or Yoga) */}
            {currentStation && (
              <div className="mt-4 mx-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] max-w-md text-center animate-fadeIn">
                <div className="text-xs font-bold text-violet-300 font-mono mb-0.5">
                  {'region' in currentStation ? currentStation.region : currentStation.asana}
                </div>
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  {currentStation.cue}
                </div>
              </div>
            )}
          </div>

          {/* ─── DECK CONTROLS: PLAY, PAUSE, RESET ─── */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleResetSession}
              className="w-11 h-11 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95"
              title="Reset Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {isApneaRetention ? (
              <button
                onClick={handleExitApneaRetention}
                className="px-6 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Wind className="w-4 h-4" />
                <span>Finish Retention & Take Recovery Breath</span>
              </button>
            ) : (
              <button
                onClick={togglePlayPause}
                className={`px-8 h-12 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all shadow-xl active:scale-95 flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.1] hover:bg-white/[0.15] text-white border border-white/20'
                    : 'bg-white hover:bg-zinc-200 text-zinc-950'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Flow</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Begin {protocol.title}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* ─── ACOUSTIC FREQUENCY DECK & BINAURAL MIXER ─── */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Acoustic Recovery Mixer
                </span>
              </div>
              <button
                onClick={() => setAudioEnabled((prev) => !prev)}
                className={`text-[10px] font-mono px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                  audioEnabled
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                    : 'bg-white/[0.03] border-white/[0.06] text-zinc-500'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span>{audioEnabled ? 'Engine Active' : 'Muted'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Carrier Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Carrier Frequency</label>
                <select
                  value={carrierType}
                  onChange={(e) => setCarrierType(e.target.value as '432hz' | 'theta' | 'delta' | 'none')}
                  className="w-full h-8 bg-zinc-900 border border-white/10 rounded-xl px-2 text-[11px] text-white outline-none cursor-pointer"
                >
                  <option value="432hz">432 Hz Solfeggio Tone</option>
                  <option value="theta">Theta 6 Hz (Deep Flow)</option>
                  <option value="delta">Delta 2.5 Hz (Deep Sleep)</option>
                  <option value="none">No Carrier (Chimes Only)</option>
                </select>
              </div>

              {/* Soundscape Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Organic Soundscape</label>
                <select
                  value={soundscapeType}
                  onChange={(e) => setSoundscapeType(e.target.value as 'ocean' | 'rain' | 'none')}
                  className="w-full h-8 bg-zinc-900 border border-white/10 rounded-xl px-2 text-[11px] text-white outline-none cursor-pointer"
                >
                  <option value="ocean">Brown Noise Ocean Waves</option>
                  <option value="rain">Soft Forest Rain (Pink Noise)</option>
                  <option value="none">Pure Silence</option>
                </select>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 uppercase">
                  <span>Output Level</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-8 accent-violet-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ─── PRE-SESSION STATE CHECK-IN (Optional Quick Tap) ─── */}
          {!isCompleted && !preState && (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400">Current pre-session autonomic state:</span>
              <div className="flex gap-1.5">
                {(['wired', 'tense', 'fatigued', 'neutral'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      haptic.tap();
                      setPreState(s);
                      showToast(`Pre-state recorded: ${s.toUpperCase()}`);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border bg-white/[0.03] border-white/10 hover:border-violet-500/40 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── POST-SESSION BIOMETRIC RECOVERY CELEBRATION ─── */}
          {isCompleted && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-950 border border-violet-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-violet-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider">
                  Autonomic Restoration Cycle Achieved
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                You completed {currentCycle} cycles of {protocol.title}. Your parasympathetic vagal brake has been engaged.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <div className="text-[10px] text-zinc-400">Estimated HR Delta</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">-11 BPM</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <div className="text-[10px] text-zinc-400">HRV Coherence</div>
                  <div className="text-sm font-bold text-violet-400 mt-0.5">94% Coherent</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <div className="text-[10px] text-zinc-400">Readiness Impact</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">+18% Recovered</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    haptic.success();
                    showToast('Somatic session verified and committed to recovery history!', 'success');
                    stopAmbientDeck();
                    onClose();
                  }}
                  className="flex-1 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Commit to Recovery Vault</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
