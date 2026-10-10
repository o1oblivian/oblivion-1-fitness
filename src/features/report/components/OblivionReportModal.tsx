import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useUserStore } from '../../../stores/useUserStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { useOblivionReport } from '../useOblivionReport';
import { publishReport, readSharePreference, revokeReport } from '../reportShareService';
import { OblivionReportView } from './OblivionReportView';
import { DexaPanel } from './DexaPanel';
import type { ReportAction } from '../types';

interface OblivionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OblivionReportModal: React.FC<OblivionReportModalProps> = ({ isOpen, onClose }) => {
  const { report, loading, source, targetSessions, setTargetSessions } = useOblivionReport(isOpen);
  const coachId = useUserStore((s) => s.assigned_coach_id);
  const [shared, setShared] = useState<boolean>(readSharePreference);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'error'>('idle');
  const sharedRef = useRef(shared);
  sharedRef.current = shared;

  // Keep the coach's copy fresh while sharing is on (debounced; skipped while still loading).
  useEffect(() => {
    if (!isOpen || !shared || loading || !report.hasData) return;
    const timer = window.setTimeout(() => {
      publishReport(report, true).then((ok) => {
        if (sharedRef.current) setSyncState(ok ? 'idle' : 'error');
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [isOpen, shared, loading, report]);

  if (!isOpen) return null;

  const toggleShare = async () => {
    tactileEngine.selection();
    const next = !shared;
    setSyncState('saving');
    const ok = next ? await publishReport(report, true) : await revokeReport();
    if (ok) {
      setShared(next);
      setSyncState('idle');
    } else {
      setSyncState('error');
    }
  };

  const handleAction = (_action: ReportAction) => {
    tactileEngine.selection();
    onClose();
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
  };

  return (
    <div
      className="fixed inset-0 z-[70000] bg-black overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),16px)]"
      role="dialog"
      aria-modal="true"
      aria-label="The Oblivion Report"
    >
      <div className="w-full max-w-[420px] mx-auto space-y-3">
        <div className="flex items-center justify-between h-11">
          <div className="text-[10px] font-mono tracking-wider text-neutral-500">
            {loading ? 'Syncing history…' : source === 'cloud' ? 'Cloud + device history' : 'Device history'}
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.selection();
              onClose();
            }}
            aria-label="Close report"
            className="w-11 h-11 -mr-2 flex items-center justify-center text-neutral-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleShare}
          disabled={syncState === 'saving'}
          role="switch"
          aria-checked={shared}
          className="w-full min-h-[56px] rounded-2xl bg-black border border-white/[0.07] px-4 py-2.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          <ShieldCheck className={`w-5 h-5 shrink-0 ${shared ? 'text-o1-ok' : 'text-neutral-500'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">Share with my coach</div>
            <div className="text-[11px] text-neutral-500 leading-snug">
              {syncState === 'error'
                ? 'Could not sync. Check your connection and try again.'
                : shared
                  ? coachId
                    ? 'Your coach can read scores and aggregates, never raw logs.'
                    : 'On. Visible to your coach once you are linked to one.'
                  : 'Off. Nothing leaves this device.'}
            </div>
          </div>
          <span
            className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${shared ? 'bg-o1-ok' : 'bg-white/[0.12]'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${shared ? 'left-[22px]' : 'left-0.5'}`}
            />
          </span>
        </button>

        <OblivionReportView
          report={report}
          mode="athlete"
          onAction={handleAction}
          targetSessions={targetSessions}
          onTargetChange={setTargetSessions}
        />

        <DexaPanel />

        <p className="text-[10px] font-mono text-neutral-600 text-center leading-relaxed pt-2">
          Computed on this device from your logs. No AI. Metrics without data show --.
        </p>
      </div>
    </div>
  );
};

export default OblivionReportModal;
