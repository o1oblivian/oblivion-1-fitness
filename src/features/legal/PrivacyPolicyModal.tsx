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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-150">
      <div className="o1-sheet-card w-full bg-black border border-white/[0.07] p-5 shadow-xl flex flex-col text-white overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-o1-teal/10 border border-o1-teal/30">
              <Lock className="w-4 h-4 text-o1-teal" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider text-neutral-100">
                Privacy &amp; Data Sanctuary Policy
              </h2>
              <p className="text-o1-label font-mono text-neutral-400">
                Local-first · Private backup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-o1-card border border-white/[0.07] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar py-3 space-y-0 text-xs font-mono text-neutral-300 leading-relaxed">
          {/* Section 1: Local-first storage and private backup */}
          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-o1-label">
              <Lock className="w-3.5 h-3.5" />
              <span>1. Local-First Storage &amp; Private Backup</span>
            </div>
            <p className="text-o1-label text-neutral-400">
              Workout logs, sets, reps, bodyweight, nutrition and hydration records are saved on
              your device first. When you are signed in, they are{' '}
              <strong>backed up to your private Oblivion 1 account</strong> so they survive a lost
              or replaced phone. Only you, and a coach you choose to share with, can read them. Your
              data is never sold or shared with advertisers.
            </p>
          </div>

          {/* Section 2: Zero Outbound Analytics & No Ad Tracking */}
          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-o1-label">
              <Activity className="w-3.5 h-3.5" />
              <span>2. Zero Third-Party Trackers, Pixels, or Data Brokers</span>
            </div>
            <p className="text-o1-label text-neutral-400">
              In full compliance with Apple App Tracking Transparency (ATT) and Google Play User
              Data policies, this application contains{' '}
              <strong>
                zero third-party tracking pixels, zero marketing SDKs, and zero behavioral telemetry
                scrapers
              </strong>
              . Your strain, heart rate and workout data are never used for advertising.
            </p>
          </div>

          {/* Section 3: Camera scans */}
          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-o1-label">
              <Camera className="w-3.5 h-3.5" />
              <span>3. Camera Scans</span>
            </div>
            <p className="text-o1-label text-neutral-400">
              Cardio console, watch and meal scan photos, and barcode scans, are sent securely to
              our scanning service, and to Google's Gemini image-analysis service, only to read the
              numbers on them. Scan photos are not saved to your account. Profile photos and reels
              you upload are stored in your account and shown to the people you choose.
            </p>
          </div>

          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-o1-label">
              <Activity className="w-3.5 h-3.5" />
              <span>Location, Bluetooth, Purchases &amp; Payments</span>
            </div>
            <p className="text-o1-label text-neutral-400">
              Buddy Radar uses your approximate location (rounded to about 1 km, only while the app
              is open and only if you allow it) to show nearby athletes; turn on Ghost Mode to hide
              yourself, and your location is removed when you delete your account. Your home gym is
              chosen from a live map search: the words you type are sent to the open-source Photon /
              OpenStreetMap search service, without your account or location. Bluetooth is used only
              to read a heart-rate sensor you choose to connect. Club Pass purchases are processed
              by Apple or Google and RevenueCat; we receive your subscription status, not your card.
              Coaching payments are processed by Stripe; we receive the sale amount and your name,
              not your card. Sign-in and cloud backup are provided by Supabase.
            </p>
          </div>

          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-o1-label">
              <Activity className="w-3.5 h-3.5" />
              <span>4. No Medical Records</span>
            </div>
            <p className="text-o1-label text-neutral-400">
              Oblivion 1 is not a medical app. We do not ask for, collect or store diagnoses,
              injuries, medications or medical history. Sleep and heart rate you choose to log are
              used only to show your own readiness and reports, and are never shared with insurers,
              employers or advertisers.
            </p>
          </div>

          {/* Section 4: User-owned export */}
          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-o1-label">
              <Lock className="w-3.5 h-3.5" />
              <span>5. Your Data Export (.o1fc)</span>
            </div>
            <p className="text-o1-label text-neutral-400">
              You own your data completely. Athletes can export a full, unencrypted or encrypted
              archive of their training history at any time via Settings &rarr; GDPR Vault Export.
              The exported file lives wherever you save it. Oblivion 1 never sees or touches it.
            </p>
          </div>

          {/* Section 5: GDPR / CCPA Irrevocable Account Purge */}
          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-o1-crimson font-bold text-o1-label">
              <Trash2 className="w-3.5 h-3.5" />
              <span>6. Unconditional Account &amp; Telemetry Erasure (GDPR / CCPA)</span>
            </div>
            <p className="text-o1-label text-neutral-400">
              You can delete your account at any time in Settings &rarr; Delete account. Our server
              then permanently deletes your profile, logs, messages, photos, reels and sign-in, and
              the app clears everything stored on your phone. Payment records for coaching sales are
              kept as the law requires. A store subscription is cancelled separately in your App
              Store or Google Play subscription settings.
            </p>
            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRequest();
                }}
                className="mt-1 text-o1-label text-o1-crimson underline font-bold hover:text-red-400 cursor-pointer"
              >
                Initiate Account Deletion Protocol &rarr;
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.05]">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-o1-card hover:bg-white/[0.06] border border-white/[0.07] text-white font-mono text-xs font-black tracking-wider cursor-pointer transition active:scale-95"
          >
            Understood &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
