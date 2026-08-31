import React, { useState, useCallback } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Send,
  Dumbbell,
  Video,
  Activity,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CoachHubPanelProps {
  coachName: string;
  coachEmail: string;
  programTitle: string;
  socialLinks?: { instagram?: string; tiktok?: string; strava?: string };
  onRequestConsultation?: () => void;
}

type FeatureTab = 'dispatch' | 'form-check' | 'macros' | 'consult';

function useTimedAction(resetDelay = 2500) {
  const [sent, setSent] = useState(false);
  const fire = useCallback(() => {
    setSent(true);
    setTimeout(() => setSent(false), resetDelay);
  }, [resetDelay]);
  return { sent, fire };
}

const ActionButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  sent: boolean;
  successLabel: string;
  actionLabel: string;
  actionIcon?: React.ReactNode;
}> = ({ onClick, disabled, sent, successLabel, actionLabel, actionIcon }) => (
  <button
    onClick={onClick}
    disabled={disabled || sent}
    className="w-full py-2 bg-stone-600 text-white font-bold text-xs rounded-xl hover:bg-stone-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
  >
    {sent ? (
      <><CheckCircle2 className="w-4 h-4" /> {successLabel}</>
    ) : (
      <>{actionIcon || <Send className="w-3.5 h-3.5" />} {actionLabel}</>
    )}
  </button>
);

const TEXTAREA_CLASS = 'w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl resize-none focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-500/20 transition-all text-white placeholder-gray-500';

export const CoachHubPanel: React.FC<CoachHubPanelProps> = ({
  coachName,
  programTitle,
  onRequestConsultation,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [activeFeature, setActiveFeature] = useState<FeatureTab>('dispatch');

  const [dispatchRoutine, setDispatchRoutine] = useState('');
  const dispatch = useTimedAction();

  const [formNote, setFormNote] = useState('');
  const formCheck = useTimedAction();

  const [macroProtein, setMacroProtein] = useState('180');
  const [macroCarbs, setMacroCarbs] = useState('250');
  const [macroFat, setMacroFat] = useState('70');
  const macroSync = useTimedAction();



  const handleDispatch = () => {
    if (!dispatchRoutine.trim()) return;
    dispatch.fire();
    setTimeout(() => setDispatchRoutine(''), 2500);
  };

  const handleFormSubmit = () => {
    if (!formNote.trim()) return;
    formCheck.fire();
    setTimeout(() => setFormNote(''), 2500);
  };



  const features: { key: FeatureTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'dispatch', label: 'Routine Dispatch', icon: <Dumbbell className="w-4 h-4" />, desc: '1-on-1 workout delivery' },
    { key: 'form-check', label: 'Form Check', icon: <Video className="w-4 h-4" />, desc: 'Submit clips for review' },
    { key: 'macros', label: 'Macro Sync', icon: <Activity className="w-4 h-4" />, desc: 'Telemetry & targets' },
    { key: 'consult', label: 'Consultation', icon: <ClipboardList className="w-4 h-4" />, desc: 'Request a consultation' },
  ];

  const MACRO_FIELDS = [
    { label: 'Protein (g)', value: macroProtein, onChange: setMacroProtein },
    { label: 'Carbs (g)', value: macroCarbs, onChange: setMacroCarbs },
    { label: 'Fat (g)', value: macroFat, onChange: setMacroFat },
  ] as const;

  return (
    <div className="rounded-2xl border-2 border-stone-500/30 bg-gradient-to-b from-stone-900/30 to-[#161922] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 bg-zinc-500/10 hover:bg-zinc-500/15 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-zinc-500/20 border border-stone-400/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-zinc-600" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-stone-300 flex items-center gap-2">
              Coach Hub Unlocked
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <div className="text-[10px] text-stone-400 font-medium">
              {coachName}'s private portal — {programTitle}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {features.map((feat) => (
              <button
                key={feat.key}
                onClick={() => setActiveFeature(feat.key)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all cursor-pointer ${
                  activeFeature === feat.key
                    ? 'bg-zinc-500/15 border-stone-400/40 text-stone-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
                title={feat.desc}
              >
                {feat.icon}
                <span className="text-[9px] font-medium text-center leading-tight">{feat.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-[#0F1218] rounded-xl border border-white/10 p-3 min-h-[110px]">
            {activeFeature === 'dispatch' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-bold text-gray-200">Send a workout routine to your Solo Logger</span>
                </div>
                <textarea
                  value={dispatchRoutine}
                  onChange={(e) => setDispatchRoutine(e.target.value)}
                  placeholder="e.g. Push Day — Bench 4x8, OHP 3x10, Incline DB 3x12, Tricep pushdowns 3x15..."
                  rows={3}
                  className={TEXTAREA_CLASS}
                />
                <ActionButton
                  onClick={handleDispatch}
                  disabled={!dispatchRoutine.trim()}
                  sent={dispatch.sent}
                  successLabel="Dispatched to your workout log!"
                  actionLabel="Dispatch to Solo Workout Logger"
                />
              </div>
            )}

            {activeFeature === 'form-check' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Video className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-bold text-gray-200">Submit a form-check clip for review</span>
                </div>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-stone-400 transition-colors cursor-pointer">
                  <Video className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-500 font-medium">Tap to upload your form video</span>
                </div>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Note to coach — what you want feedback on..."
                  rows={2}
                  className={TEXTAREA_CLASS}
                />
                <ActionButton
                  onClick={handleFormSubmit}
                  disabled={!formNote.trim()}
                  sent={formCheck.sent}
                  successLabel="Clip submitted — feedback incoming!"
                  actionLabel="Submit for Video Review"
                />
              </div>
            )}

            {activeFeature === 'macros' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-bold text-gray-200">Sync custom macro targets from your coach</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MACRO_FIELDS.map((f) => (
                    <div key={f.label}>
                      <label className="text-[9px] text-gray-500 uppercase block mb-1">{f.label}</label>
                      <input
                        type="number"
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                        className="w-full px-2 py-2 text-xs bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-stone-400 text-white"
                      />
                    </div>
                  ))}
                </div>
                <ActionButton
                  onClick={() => macroSync.fire()}
                  disabled={false}
                  sent={macroSync.sent}
                  successLabel="Macros synced to your Fuel tab!"
                  actionLabel="Sync to My Fuel Targets"
                  actionIcon={<Activity className="w-3.5 h-3.5" />}
                />
              </div>
            )}

            {activeFeature === 'consult' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-bold text-gray-200">Request a consultation with {coachName}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Submit a structured consultation request. Your recent training, nutrition, sleep, and bodyweight data will be attached automatically so {coachName} can assess your starting point.
                </p>
                <button
                  onClick={onRequestConsultation}
                  className="w-full py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" /> Open Consultation Form
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachHubPanel;
