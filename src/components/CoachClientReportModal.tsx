import React, { useState } from 'react';
import { 
  X, FileText, Download, Moon, Activity, Flame
} from 'lucide-react';
import { COACH_CLIENTS } from '../data/exerciseDatabase';
import { AthleteData } from '../types';

interface CoachClientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClient?: AthleteData | null;
  coachName?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const CoachClientReportModal: React.FC<CoachClientReportModalProps> = ({
  isOpen,
  onClose,
  targetClient,
  coachName = 'Head Coach',
  showToast,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    targetClient?.key || Object.keys(COACH_CLIENTS)[0] || ''
  );
  const [reportPeriod, setReportPeriod] = useState<'7d' | '30d' | 'cycle'>('30d');
  const [coachNotes, setCoachNotes] = useState<string>(
    'Exceptional consistency this month. Strength metrics on major compounds are trending +8% up. Focus next cycle on stabilizing eccentric speed on squats and maintaining 8+ hours sleep consistency.'
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const clientList = Object.values(COACH_CLIENTS);
  const activeClient = COACH_CLIENTS[selectedClientId] || targetClient || clientList[0];

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast(`PDF Performance Report exported for ${activeClient.name}!`, 'success');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-[#12141A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-black/40 border-b border-white/10 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Official o1fc Dossier Generator
              </div>
              <h2 className="text-base font-black tracking-tight text-white">Athlete Progress & Performance Report</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Athlete Selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-400 mb-1.5">
              Select Athlete Dossier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {clientList.map((c) => {
                const isSelected = selectedClientId === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedClientId(c.key)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-white bg-white/15'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-white shrink-0">
                      {c.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{c.name.split(' ')[0]}</div>
                      <div className="text-[9px] font-mono text-zinc-400 truncate">{c.handle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-zinc-400">
              Audit Period
            </span>
            <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/10">
              {[
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'cycle', label: 'Full 12-Wk Cycle' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setReportPeriod(p.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    reportPeriod === p.id
                      ? 'bg-white text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Document Preview Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <div className="text-[9px] font-mono font-bold uppercase text-zinc-400">
                  o1fc Certified Athletic Audit
                </div>
                <div className="text-sm font-black text-white">
                  {activeClient.name} • {activeClient.handle}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono text-zinc-400">Prepared by: {coachName}</div>
                <div className="text-[9px] font-mono text-zinc-300 font-bold">● Status: Active Tier</div>
              </div>
            </div>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[9px] font-mono uppercase text-zinc-400">Total Volume</div>
                <div className="text-sm font-black font-mono text-white mt-0.5">{activeClient.volume}</div>
                <div className="text-[8px] font-mono text-zinc-400">↗ +12.4% vs last mo</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[9px] font-mono uppercase text-zinc-400">Compliance</div>
                <div className="text-sm font-black font-mono text-white mt-0.5">96.8%</div>
                <div className="text-[8px] font-mono text-zinc-400">24 / 25 sessions</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[9px] font-mono uppercase text-zinc-400">PRs Logged</div>
                <div className="text-sm font-black font-mono text-white mt-0.5">6 Milestones</div>
                <div className="text-[8px] font-mono text-zinc-400">Bench & Squat</div>
              </div>
            </div>

            {/* Recovery Telemetry Summary */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Avg Sleep: 7h 48m</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Avg HRV: 68 ms</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Readiness: 89%</span>
              </div>
            </div>
          </div>

          {/* Coach Written Appraisal */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-400 mb-1">
              Coach Assessment & Forward Directives
            </label>
            <textarea
              rows={3}
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs leading-relaxed font-sans focus:outline-none focus:border-white/30 text-white placeholder-zinc-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating Report...' : `Export PDF Dossier (${activeClient.name.split(' ')[0]})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
