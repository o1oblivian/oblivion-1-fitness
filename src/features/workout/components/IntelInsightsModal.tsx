import React, { useEffect, useMemo, useState } from 'react';
import { X, FileBarChart } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useSubscription } from '../../../context/SubscriptionContext';
import { useOblivionReport } from '../../report/useOblivionReport';
import { buildWeeklyIntel } from '../../report/weeklyIntel';
import { OblivionReportModal } from '../../report/components/OblivionReportModal';
import { ActionList } from '../../report/components/ActionList';
import { IntelTodayPanel } from './IntelTodayPanel';
import { IntelLockedView } from './intel/IntelLockedView';
import { IntelWeekTab } from './intel/IntelWeekTab';
import { IntelTrainingTab } from './intel/IntelTrainingTab';
import { IntelRecoveryTab } from './intel/IntelRecoveryTab';

type IntelTab = 'today' | 'week' | 'training' | 'recovery' | 'next';

interface IntelInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: IntelTab;
}

const TABS: { id: IntelTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'training', label: 'Training' },
  { id: 'recovery', label: 'Sleep & Fuel' },
  { id: 'next', label: 'Next moves' },
];

export const IntelInsightsModal: React.FC<IntelInsightsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'week',
}) => {
  const { hasFullAccess } = useSubscription();
  const [activeTab, setActiveTab] = useState<IntelTab>(initialTab);
  const [showReport, setShowReport] = useState(false);
  const { report, sets, sleep, historyByDate } = useOblivionReport(isOpen && hasFullAccess);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const weekly = useMemo(
    () => buildWeeklyIntel(sets, historyByDate, report, Date.now()),
    [sets, historyByDate, report],
  );

  if (!isOpen) return null;

  const target = report.stats.targetSessionsPerWeek;

  const goTrain = () => {
    tactileEngine.triggerSelectionBuzz();
    onClose();
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Oblivion Intel Insights"
      className="fixed inset-0 z-50 bg-o1-canvas select-none flex flex-col animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[420px] mx-auto h-full flex flex-col px-4 text-o1-text">
        <div className="shrink-0 pt-[max(env(safe-area-inset-top),12px)] pb-2 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 w-1 h-9 rounded-full bg-o1-crimson" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-light tracking-wide text-o1-text">
                  Oblivion Intel Insights
                </h3>
                <span className="px-1.5 py-0.5 rounded-md border border-o1-crimson/60 text-o1-label font-medium tracking-wider text-o1-text">
                  PRO
                </span>
              </div>
              <div className="text-o1-label text-o1-muted">
                Computed on this device from your logs
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 -mt-1 rounded-xl hover:bg-white/[0.06] text-o1-stone flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hasFullAccess ? (
          <IntelLockedView />
        ) : (
          <>
            <div
              role="tablist"
              className="shrink-0 w-full py-2 border-b border-white/[0.07] flex flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setActiveTab(tab.id);
                  }}
                  className={`h-10 px-3.5 rounded-full text-o1-caption font-semibold whitespace-nowrap flex items-center justify-center shrink-0 transition-all cursor-pointer border ${
                    activeTab === tab.id
                      ? 'bg-o1-sheet text-o1-text border-o1-crimson/70'
                      : 'bg-transparent text-o1-muted border-white/[0.07] hover:text-o1-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-full py-3 space-y-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {activeTab === 'today' && (
                <IntelTodayPanel report={report} sets={sets} sleep={sleep} onApplied={onClose} />
              )}
              {activeTab === 'week' && <IntelWeekTab weekly={weekly} target={target} />}
              {activeTab === 'training' && (
                <IntelTrainingTab weekly={weekly} report={report} target={target} />
              )}
              {activeTab === 'recovery' && <IntelRecoveryTab weekly={weekly} />}
              {activeTab === 'next' && (
                <ActionList
                  title="Next moves"
                  actions={report.actions}
                  ctaLabel="Train"
                  onAction={goTrain}
                />
              )}
            </div>

            <div className="shrink-0 pt-2 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-white/[0.07] bg-o1-canvas">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setShowReport(true);
                }}
                className="w-full min-h-[48px] rounded-2xl bg-o1-sheet border border-white/[0.12] hover:border-white/[0.24] text-o1-text text-o1-body font-medium flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <FileBarChart className="w-4 h-4 text-o1-crimson" />
                Open The Oblivion Report
              </button>
            </div>
          </>
        )}
      </div>

      <OblivionReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
};
