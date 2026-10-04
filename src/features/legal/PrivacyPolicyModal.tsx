import React from 'react';
import { X, Lock, Camera, Activity, Trash2 } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDeleteRequest?: () => void;
}

export const PrivacyPolicyModal: React.FC<Props> = ({ isOpen, onClose, onDeleteRequest }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#09090b] border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] text-white">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/30">
              <Lock className="w-4 h-4 text-[#06b6d4]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-100">Privacy &amp; Data Sanctuary Policy</h2>
              <p className="text-[10px] font-mono text-neutral-400">100% Local-First · Zero-Cloud Architecture</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-[#121214] border border-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar py-4 space-y-4 text-xs font-mono text-neutral-300 leading-relaxed">
          {/* Section 1: Zero-Cloud Sovereign Device Architecture */}
          <div className="p-3 rounded-2xl bg-[#121214] border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>1. Zero-Cloud Sovereign Sanctuary (On-Device Storage)</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Oblivion 1 Fitness Club operates on a strict <strong>100% Local-First, Zero-Cloud Architecture</strong>. Your device is the absolute source of truth. All workout logs, sets, reps, bodyweight metrics, macronutrient records, hydration telemetry, and coach rosters write directly to encrypted on-device storage. Telemetry is never transmitted to, hosted on, or harvested by corporate cloud servers or external databases.
            </p>
          </div>

          {/* Section 2: Zero Outbound Analytics & No Ad Tracking */}
          <div className="p-3 rounded-2xl bg-[#121214] border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-400 font-bold uppercase text-[11px]">
              <Activity className="w-3.5 h-3.5" />
              <span>2. Zero Third-Party Trackers, Pixels, or Data Brokers</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              In full compliance with Apple App Tracking Transparency (ATT) and Google Play User Data policies, this application contains <strong>zero third-party tracking pixels, zero marketing SDKs, and zero behavioral telemetry scrapers</strong>. Your physical strain, heart rate data, and workout schedules remain entirely confined to your hardware.
            </p>
          </div>

          {/* Section 3: Camera, Vision & On-Device Processing */}
          <div className="p-3 rounded-2xl bg-[#121214] border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[11px]">
              <Camera className="w-3.5 h-3.5" />
              <span>3. Camera &amp; Vision Scanner Ephemeral Processing</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Cardio console photos and meal scan images are processed in-flight via local client buffers for biometric OCR and nutrition estimation. Images are never permanently retained or uploaded to external cloud storage.
            </p>
          </div>

          {/* Section 4: User-Owned Air-Gapped Backups */}
          <div className="p-3 rounded-2xl bg-[#121214] border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold uppercase text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>4. Air-Gapped User-Owned Data Vaults (.o1fc)</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              You own your data completely. Athletes can export a full, unencrypted or encrypted archive of their training history at any time via Settings &rarr; GDPR Vault Export. This archive lives solely on your local device storage, personal iCloud, or personal drive. Oblivion 1 never sees or touches it.
            </p>
          </div>

          {/* Section 5: GDPR / CCPA Irrevocable Account Purge */}
          <div className="p-3 rounded-2xl bg-[#121214] border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#C4121A] font-bold uppercase text-[11px]">
              <Trash2 className="w-3.5 h-3.5" />
              <span>5. Unconditional Account &amp; Telemetry Erasure (GDPR / CCPA)</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              In accordance with Apple App Store Guideline 5.1.1(v) and Google Play Safety standards, athletes have the permanent right to delete their profile. Tapping "Delete Athlete Account" immediately clears all on-device records, caches, and cryptographic keys irreversibly.
            </p>
            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => { onClose(); onDeleteRequest(); }}
                className="mt-1 text-[10px] text-[#C4121A] underline font-bold uppercase hover:text-red-400 cursor-pointer"
              >
                Initiate Account Deletion Protocol &rarr;
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="w-full py-3 rounded-2xl bg-[#121214] hover:bg-neutral-800 border border-neutral-700 text-white font-mono text-xs font-black uppercase tracking-wider cursor-pointer transition active:scale-95"
          >
            Understood &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default PrivacyPolicyModal;
