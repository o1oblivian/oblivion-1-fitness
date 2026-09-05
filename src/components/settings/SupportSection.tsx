import React, { useState } from 'react';
import { Send, CheckCircle, X, Search, ChevronRight, Compass } from 'lucide-react';
import { SectionHeader, SettingsGroup, SettingsRow } from './SettingsShared';
import { SupportTicketModal } from './SupportTicketModal';
import { FirstTimeOnboardingGuide } from '../FirstTimeOnboardingGuide';
import { useModalBackHandler } from '../../utils/modalHistory';

interface Props {
  onSendFeedback?: (msg: string) => void;
  onExportData?: () => void;
  triggerToast?: (msg: string) => void;
  onBack?: () => void;
}

const FAQ_CATEGORIES = [
  {
    title: 'Workout Telemetry',
    items: [
      { q: 'How do I log a workout?', a: 'Open the Solo / Training OS tab and tap any exercise to log sets with the rotary dial.' },
      { q: 'How does strain calculate?', a: 'Strain updates after completing logged sets based on tonnage, volume, and RPE.' },
    ],
  },
  {
    title: 'Nutrition & Macros',
    items: [
      { q: 'How does Fuel OS calculate targets?', a: 'Fuel OS estimates BMR/TDEE from your biometrics and goals to set protein and calorie targets.' },
    ],
  },
  {
    title: 'Radar & Network',
    items: [
      { q: 'How does Buddy Radar work?', a: 'Radar detects other athletes training at partner gyms in your zone when enabled in Privacy.' },
    ],
  },
];

export function SupportSection({ onSendFeedback, onExportData, triggerToast }: Props) {
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showHelpCentre, setShowHelpCentre] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  useModalBackHandler(showHelpCentre, () => setShowHelpCentre(false), 'settings_help_centre');
  const [helpSearch, setHelpSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleSend = () => {
    if (!feedbackText.trim()) return;
    onSendFeedback?.(feedbackText.trim());
    setFeedbackSent(true);
    setFeedbackText('');
    triggerToast?.('Feedback submitted');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const handleExport = () => {
    onExportData?.();
    const data = {
      exportedAt: new Date().toISOString(),
      profile: JSON.parse(localStorage.getItem('o1fc_user_state') || '{}'),
      workoutLogs: JSON.parse(localStorage.getItem('o1fc_workout_logs') || '[]'),
      mealLogs: JSON.parse(localStorage.getItem('o1fc_meal_logs') || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ofc-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast?.('Data exported successfully');
  };

  return (
    <div>
      <SectionHeader title="Help & Support" />
      <SettingsGroup>
        <SettingsRow
          label="System Onboarding Tutorial"
          sublabel="Replay interactive guide for dial calibration, solo OS & fuel"
          onClick={() => setShowGuideModal(true)}
        />
        <SettingsRow
          label="Help Centre"
          sublabel="FAQs, troubleshooting guides & OS walkthroughs"
          onClick={() => setShowHelpCentre(true)}
        />
        <SettingsRow
          label="Contact Support"
          sublabel="Submit a ticket to our concierge team"
          onClick={() => setShowTicketModal(true)}
        />
        <SettingsRow
          label="Export Your Data"
          sublabel="Download your complete telemetry & logs as JSON"
          onClick={handleExport}
        />
      </SettingsGroup>

      {/* Send Feedback Group */}
      <SectionHeader title="Feedback" />
      <SettingsGroup>
        <div className="p-4">
          {feedbackSent ? (
            <div className="flex items-center gap-2 py-2">
              <CheckCircle className="w-4 h-4 text-[#EA4335]" />
              <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                Thank you for your feedback!
              </span>
            </div>
          ) : (
            <div className="space-y-2.5">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts or suggest a feature..."
                rows={2}
                className="w-full text-xs text-zinc-800 dark:text-zinc-200 bg-transparent outline-none resize-none placeholder:text-zinc-400 leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!feedbackText.trim()}
                  className="h-[30px] px-3 rounded-full bg-[#EA4335] text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-40 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </SettingsGroup>

      {/* Help Centre Modal */}
      {showHelpCentre && (
        <div className="fixed inset-0 z-[400] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150" onClick={() => setShowHelpCentre(false)}>
          <div 
            className="w-full max-w-lg max-h-[85vh] bg-zinc-50 dark:bg-zinc-950 rounded-t-[1.5rem] sm:rounded-2xl overflow-hidden flex flex-col border-t sm:border border-zinc-200/80 dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-2 pb-2 px-4 flex flex-col items-center border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
              <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mb-1.5 sm:hidden" />
              <div className="w-full flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Help Centre</h2>
                <button
                  type="button"
                  onClick={() => setShowHelpCentre(false)}
                  className="w-7 h-7 rounded-full bg-zinc-200/70 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <Search className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                  placeholder="Search help articles..."
                  className="w-full text-xs text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-stone-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              {FAQ_CATEGORIES.map((cat) => (
                <div key={cat.title} className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-2.5 shadow-xs">
                  <p className="text-[10px] font-semibold tracking-wider text-stone-400 dark:text-zinc-500 uppercase mb-1.5">
                    {cat.title}
                  </p>
                  <div className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                    {cat.items.map((item) => {
                      const isOpen = expandedFaq === item.q;
                      return (
                        <button
                          key={item.q}
                          type="button"
                          onClick={() => setExpandedFaq(isOpen ? null : item.q)}
                          className="w-full text-left py-2 px-1 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-900 dark:text-white text-xs">{item.q}</span>
                            <ChevronRight className={`w-3.5 h-3.5 text-stone-400 dark:text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </div>
                          {isOpen && (
                            <p className="text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed text-[11px]">{item.a}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SupportTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        triggerToast={triggerToast || (() => {})}
      />

      {showGuideModal && (
        <FirstTimeOnboardingGuide
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          forceShow={true}
        />
      )}
    </div>
  );
}
