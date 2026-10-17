import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

type SafetyTopic = 'report' | 'readiness';

const PRIORITIES: Record<SafetyTopic, string[]> = {
  report: [
    'Consistency first: showing up on your planned days matters more than any single heavy session.',
    'Steady progress over fast jumps: small weekly increases in weight or reps.',
    'Balance: train every major muscle group, not just favourites.',
    'Recovery: sleep, food and water decide how much of your training actually sticks.',
  ],
  readiness: [
    'Readiness reflects only what you log: sleep and resting heart rate.',
    'A low score means go lighter or rest, not push through.',
    'Unlogged values stay -- and never count against you.',
  ],
};

const PREVENT = [
  'Warm up for 5–10 minutes and do a few lighter sets before working weight.',
  'Stop a set when form breaks. Leave 1–3 reps in reserve on most sets.',
  'Add load gradually. Avoid jumps of more than about 10% a week.',
  'Sharp pain, dizziness, chest pain or shortness of breath: stop immediately.',
  'Take a lighter week every 4–8 weeks, or sooner if you feel run down.',
  'Use a spotter or safety pins on heavy bench and squat.',
];

interface Props {
  topic: SafetyTopic;
}

export const TrainingSafetyInfo: React.FC<Props> = ({ topic }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Priorities and injury prevention"
        aria-expanded={open}
        onClick={() => {
          tactileEngine.selection();
          setOpen((v) => !v);
        }}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors ${open ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <div className="order-last basis-full w-full mt-1 mb-2 rounded-2xl bg-o1-surface border border-white/[0.07] p-3.5 space-y-3 text-left">
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-o1-text">What this prioritises</h4>
            <ul className="space-y-1 text-[11px] text-o1-muted leading-snug list-disc pl-4">
              {PRIORITIES[topic].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-o1-text">Staying injury-free</h4>
            <ul className="space-y-1 text-[11px] text-o1-muted leading-snug list-disc pl-4">
              {PREVENT.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <p className="text-[10px] text-o1-muted leading-snug border-t border-white/[0.07] pt-2">
            Oblivion 1 is a training log, not a medical app. Nothing here is medical advice. If you
            have an injury, condition or pain, talk to a doctor or physiotherapist before training.
          </p>
        </div>
      )}
    </>
  );
};
