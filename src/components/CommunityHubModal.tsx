import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  Users,
  MessageSquare,
  Share2,
  ExternalLink,
  Award,
  Heart,
} from 'lucide-react';

interface CommunityHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShareModal?: () => void;
}

export const CommunityHubModal: React.FC<CommunityHubModalProps> = ({
  isOpen,
  onClose,
  onOpenShareModal,
}) => {
  if (!isOpen) return null;

  const communities = [
    {
      name: 'Reddit /r/O1FC_Training',
      desc: 'Form reviews, program tweaks, and daily athlete accountability.',
      members: '12.4K Athletes',
      tag: 'REDDIT',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
      url: 'https://reddit.com',
    },
    {
      name: 'O1FC Discord Syndicate',
      desc: 'Real-time telemetry discussions, coach live Q&As & peer syncs.',
      members: '8.1K Active',
      tag: 'DISCORD',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
      url: 'https://discord.com',
    },
    {
      name: 'Strava O1FC Athletic Club',
      desc: 'Log GPS miles, compare weekly pacing & race segment leaderboards.',
      members: '4.9K Runners',
      tag: 'STRAVA',
      icon: <Award className="w-5 h-5" />,
      color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
      url: 'https://strava.com',
    },
  ];

  const communityHighlights = [
    {
      athlete: 'Sarah K.',
      city: 'Sydney',
      achievement: '180kg Deadlift PR (Hybrid Racing)',
      quote: 'The real-time telemetry split gave me the exact pacing needed on the SkiErg intervals.',
      likes: '142',
    },
    {
      athlete: 'Liam M.',
      city: 'Melbourne',
      achievement: '100% Macro Consistency (30 Days)',
      quote: 'Fuel OS and Coach Dispatch kept me on track while traveling across continents.',
      likes: '89',
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 w-full max-w-lg shadow-2xl relative text-zinc-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                O1FC Community Hub
              </h2>
              <span className="text-[9px] font-semibold bg-red-50 dark:bg-red-950/50 text-[#EA4335] px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/50">
                OFFICIAL
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Connect across platforms & share milestones
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-nude-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Community Stats Row */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-center">
          <div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white block">Join Now</span>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Early Access</span>
          </div>
          <div className="border-x border-zinc-200 dark:border-zinc-800">
            <span className="text-sm font-bold text-[#EA4335] block">Free</span>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Included</span>
          </div>
          <div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white block">24/7</span>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Peer Support</span>
          </div>
        </div>

        {/* Share Goal Banner */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 pr-2">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
              Got a new PR or Goal?
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Generate a branded story card for social platforms.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenShareModal?.();
            }}
            className="py-1.5 px-3.5 bg-[#EA4335] hover:bg-red-600 text-white font-semibold text-xs rounded-full shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Goal</span>
          </button>
        </div>

        {/* Official Social Channels List */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
            Official Communities
          </h3>

          <div className="space-y-2">
            {communities.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border ${c.color} shrink-0`}>
                    {c.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-[#EA4335] transition-colors truncate">
                        {c.name}
                      </h4>
                      <span className="text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 shrink-0">
                        {c.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{c.desc}</p>
                    <span className="text-[10px] text-[#EA4335] font-semibold mt-0.5 block">
                      {c.members}
                    </span>
                  </div>
                </div>

                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-white transition-colors shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
            Community Highlights
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {communityHighlights.map((h, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-white">{h.athlete} ({h.city})</span>
                  <span className="text-[10px] text-[#EA4335] flex items-center gap-1 font-semibold">
                    <Heart className="w-3 h-3 fill-current" /> {h.likes}
                  </span>
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">{h.achievement}</div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">"{h.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
