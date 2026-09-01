import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ProfileSection } from './ProfileSection';
import { AppearanceSection } from './AppearanceSection';
import { FeedbackSection } from './FeedbackSection';
import { LocationSection } from './LocationSection';
import { TrainingSection } from './TrainingSection';
import { DevicesSection } from './DevicesSection';
import { NotificationsSection } from './NotificationsSection';
import { PrivacySection } from './PrivacySection';
import { LegalSection } from './LegalSection';
import { SupportSection } from './SupportSection';
import { MembershipSection } from './MembershipSection';
import { AccountSection } from './AccountSection';
import { useAuthStorage, getSessionUserEmail } from '../../hooks/useAuthStorage';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onDeleteAccount?: (email: string) => void;
  onOpenPrivacy?: () => void;
  onOpenGymNetwork?: () => void;
  onOpenTravelPass?: () => void;
  onOpenPayPlan?: (tier?: string) => void;
  onRerunLaunchProtocol?: () => void;
  onOpenWallpaperSettings?: () => void;
  onSendFeedback?: (msg: string) => void;
  onExportData?: () => void;
  onSaveProfileImage?: (url: string) => void;
  triggerToast?: (msg: string) => void;
}

export function SettingsPage({
  isOpen,
  onClose,
  onLogout,
  onDeleteAccount,
  onOpenGymNetwork,
  onOpenTravelPass,
  onOpenPayPlan,
  onRerunLaunchProtocol,
  onOpenWallpaperSettings,
  onSendFeedback,
  onExportData,
  onSaveProfileImage,
  triggerToast = () => {},
}: SettingsPageProps) {
  const { getProfile, updateProfile } = useAuthStorage();
  const profile = getProfile() || {};
  const userEmail = getSessionUserEmail() || profile.email || 'athlete@ofc.com';

  const [currentName, setCurrentName] = useState(profile.display_name || '');
  const [currentHandle, setCurrentHandle] = useState(profile.username || '');
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch {}
    return 'light';
  });
  const [inputMethod, setInputMethod] = useState<'dial' | 'numpad'>(() => {
    try {
      const s = localStorage.getItem('ofc_input_method');
      if (s === 'dial' || s === 'numpad') return s;
    } catch {}
    return 'dial';
  });

  useEffect(() => {
    if (isOpen) {
      const p = getProfile() || {};
      setCurrentName(p.display_name || '');
      setCurrentHandle(p.username || '');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelectThemeMode = (mode: 'dark' | 'light' | 'system') => {
    setThemeMode(mode);
    try {
      localStorage.setItem('theme', mode);
    } catch {}
    updateProfile({ theme: mode });
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
  };

  const handleSelectInputMethod = (m: 'dial' | 'numpad') => {
    setInputMethod(m);
    try {
      localStorage.setItem('ofc_input_method', m);
    } catch {}
    updateProfile({ input_method: m });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#F4F4F5] dark:bg-[#09090B] overflow-hidden font-sans flex flex-col">
      {/* Top Header Bar with Safe-Area Clearance */}
      <div
        className="sticky top-0 z-30 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md px-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0"
        style={{
          paddingTop: 'max(0.625rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
          paddingBottom: '0.625rem',
          minHeight: 'calc(env(safe-area-inset-top, 0px) + 3.25rem)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight text-center">
          Settings
        </h1>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-[#C4121A] dark:text-[#D91F28] hover:text-[#B8121A] dark:hover:text-[#C4121A] cursor-pointer px-2 py-1"
        >
          Done
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2.5">
        <div className="max-w-md mx-auto space-y-3 pb-[max(3rem,calc(env(safe-area-inset-bottom,0px)+2.5rem))]">
          {/* Profile Card */}
          <ProfileSection
            name={currentName}
            handle={currentHandle}
            profileImage={profile.avatar_url}
            onSaveName={setCurrentName}
            onSaveHandle={setCurrentHandle}
            onSaveProfileImage={onSaveProfileImage}
          />

          {/* Membership */}
          <MembershipSection onOpenPayPlan={onOpenPayPlan} />

          {/* Training & Schedule */}
          <TrainingSection />

          {/* Location & Travel */}
          <LocationSection
            onOpenGymNetwork={onOpenGymNetwork}
            onOpenTravelPass={onOpenTravelPass}
            triggerToast={triggerToast}
          />

          {/* Appearance */}
          <AppearanceSection
            themeMode={themeMode}
            onSelectThemeMode={handleSelectThemeMode}
            inputMethod={inputMethod}
            onSelectInputMethod={handleSelectInputMethod}
            onOpenWallpaperSettings={onOpenWallpaperSettings}
          />

          {/* Audio & Vibration Feedback */}
          <FeedbackSection />

          {/* Notifications */}
          <NotificationsSection />

          {/* Privacy & Social Visibility */}
          <PrivacySection />

          {/* Connected Devices & Wearables */}
          <DevicesSection triggerToast={triggerToast} />

          {/* Help & Support */}
          <SupportSection
            onSendFeedback={onSendFeedback}
            onExportData={onExportData}
            triggerToast={triggerToast}
          />

          {/* Legal */}
          <LegalSection />

          {/* Account */}
          <AccountSection
            userEmail={userEmail}
            onLogout={onLogout}
            onDeleteAccount={onDeleteAccount}
            onRerunLaunchProtocol={onRerunLaunchProtocol}
            triggerToast={triggerToast}
          />
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
