import React from 'react';
import { ArrowRight, Dumbbell, ScanLine, Users } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useConsultationStore } from '../../induction/useConsultationStore';

interface AthleteLaunchProtocolCardProps {
  onLaunch: () => void;
  onSkip?: () => void;
}

const PILLARS = [
  {
    icon: Dumbbell,
    title: 'Training',
    body: 'A plan built around your discipline, with every set logged on the rotary dial.',
  },
  {
    icon: ScanLine,
    title: 'Fuel',
    body: 'Photograph a meal for a macro estimate, then track water and supplements.',
  },
  {
    icon: Users,
    title: 'Coaching',
    body: 'Find a coach, follow their programs and learn from form reels.',
  },
];

export const AthleteLaunchProtocolCard: React.FC<AthleteLaunchProtocolCardProps> = ({
  onLaunch,
  onSkip,
}) => {
  const consulted = useConsultationStore((state) => state.locked);

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none text-o1-text animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center">
        <img
          src="/brand/o1fc-hero.png"
          alt="Oblivion 1 Fitness Club"
          width={1466}
          height={900}
          className="h-auto w-[70%] max-w-[250px] select-none"
          draggable={false}
        />
        <h1 className="mt-3 font-display text-o1-heading font-light leading-tight tracking-[-0.01em]">
          Welcome to the club
        </h1>
        <p className="mt-1.5 max-w-[290px] text-o1-body font-normal leading-relaxed text-o1-muted/80">
          {consulted
            ? 'Your profile is set. Everything is ready on the floor.'
            : 'A short consultation tailors your training, then you choose your membership.'}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05] backdrop-blur-md">
              <Icon className="h-4 w-4 text-o1-text" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-o1-control font-normal">{title}</p>
              <p className="mt-0.5 text-o1-caption font-normal leading-relaxed text-o1-muted">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 px-2 text-center text-o1-label font-normal leading-relaxed text-o1-muted/80">
        Camera, location and notifications are only requested when you open a feature that uses
        them.
      </p>

      <div className="mt-5 space-y-1">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerDialHaptic();
            onLaunch();
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-o1-crimson text-o1-control font-medium text-white transition hover:bg-o1-crimson-hover active:scale-[0.98] active:bg-o1-crimson-press"
        >
          {consulted ? 'Enter the club' : 'Begin consultation'}
          <ArrowRight className="h-4 w-4" />
        </button>
        {onSkip ? (
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onSkip();
            }}
            className="h-10 w-full text-o1-body font-normal text-o1-muted"
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
};
