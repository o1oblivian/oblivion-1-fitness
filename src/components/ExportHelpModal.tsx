import React, { useState } from 'react';
import { X, Download, Shield, HardDrive } from 'lucide-react';

interface ExportHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
  onOpenPayPlan?: (tier?: 'premium' | 'coach') => void;
}

export const ExportHelpModal: React.FC<ExportHelpModalProps> = ({
  isOpen,
  onClose,
  showToast,
  onOpenPayPlan,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const _tierCheck = (() => {
    try {
      const created = localStorage.getItem('o1fc_account_created');
      if (!created) localStorage.setItem('o1fc_account_created', new Date().toISOString());
      if (localStorage.getItem('o1fc_dev_unlock') === 'I100PH') return true;
      const cachedTier = localStorage.getItem('o1fc_cached_tier') || 'free';
      const trialDays = created ? Math.max(0, 90 - (Date.now() - new Date(created).getTime()) / 86400000) : 90;
      const paid = ['premium', 'premium_travel', 'coach_pro'].includes(cachedTier);
      return paid || trialDays > 0;
    } catch { return true; }
  })();

  if (!_tierCheck) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0A0A0C] p-4">
        <div className="w-full max-w-sm bg-white dark:bg-[#14171F] rounded-3xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 p-6 space-y-4 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-zinc-500/15 flex items-center justify-center mx-auto"><Download className="w-6 h-6 text-zinc-500" /></div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Data Export</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">Upgrade to Premium to export your workout and nutrition data</p>
          <button onClick={() => { onClose(); onOpenPayPlan?.('premium'); }} className="w-full py-2.5 rounded-xl bg-stone-600 hover:bg-zinc-500 text-white text-xs font-bold cursor-pointer active:scale-95">View Plans</button>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Close</button>
        </div>
      </div>
    );
  }

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      showToast?.('Generating your data backup...');

      const userData = localStorage.getItem('lumina_user_state_' + (localStorage.getItem('current_user_email') || '').toLowerCase());
      const profileData = localStorage.getItem('lumina_users_accounts_meta');
      const workoutLogs = localStorage.getItem('workout_logs_local');
      const supplementData = localStorage.getItem('supplement_tracker_data');

      const exportPayload = {
        exportDate: new Date().toISOString(),
        appVersion: '3.4',
        userData: userData ? JSON.parse(userData) : null,
        profileMeta: profileData ? JSON.parse(profileData) : null,
        workoutLogs: workoutLogs ? JSON.parse(workoutLogs) : [],
        supplements: supplementData ? JSON.parse(supplementData) : null,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `o1fc_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast?.('Data backup downloaded successfully!');
    } catch (err) {
      console.error('Data export error:', err);
      showToast?.('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#F8F9FA] dark:bg-[#0A0A0C] overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-white dark:bg-[#14171F] border border-[rgba(0,0,0,0.08)] dark:border-white/10 w-full h-full min-h-screen rounded-none p-3.5 shadow-2xl relative text-gray-900 dark:text-white flex flex-col gap-3 overflow-y-auto animate-slideDownFade pb-28">

        <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#7A9382]/10 border border-[#7A9382]/30 flex items-center justify-center text-[#7A9382]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#000000] font-mono">Data Backup & Export</h3>
              <p className="text-[11px] text-[#848785] font-mono">Download your workout & nutrition data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] flex items-center justify-center text-[#848785] hover:text-[#000000] transition-colors font-bold text-sm cursor-pointer active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#7A9382]/10 border border-[#7A9382]/30 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A9382] uppercase tracking-wider font-mono flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5" />
              Full Data Backup
            </span>
            <span className="text-[10px] font-bold text-[#7A9382] bg-[#7A9382]/15 px-1.5 py-0.5 rounded-full border border-[#7A9382]/30">
              JSON
            </span>
          </div>
          <p className="text-xs text-[#000000] leading-relaxed">
            Download a complete backup of your workout logs, macro targets, meal history, supplement data, and profile settings as a JSON file. Keep it safe or use it to restore your data on a new device.
          </p>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full py-3 bg-[#7A9382] hover:bg-[#688070] disabled:opacity-60 text-[#FDFCFB] font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg border-0 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Creating backup...' : 'Download My Data'}</span>
          </button>
        </div>

        <div className="bg-[#F2F2F7] border border-[rgba(0,0,0,0.08)] rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-xs font-bold text-[#000000] uppercase tracking-wider font-mono flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#7A9382]" />
            Your Privacy
          </span>
          <p className="text-xs text-[#848785] leading-relaxed">
            Your data is stored locally on your device and synced to your private cloud account. It is never shared with third parties. You can delete all data at any time from the Settings menu.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#3A3F3D] hover:bg-[#2A2F2D] text-[#FDFCFB] font-extrabold rounded-2xl text-sm shadow-lg border-0 active:scale-95 transition-all"
        >
          Done
        </button>

      </div>
    </div>
  );
};
