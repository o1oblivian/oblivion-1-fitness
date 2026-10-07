import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useProductionSettings } from '../hooks/useAthleteSettings';
import { SettingsErrorBoundary } from './settings/SettingsErrorBoundary';
import { SettingsContent } from './settings/SettingsContent';
import { DeleteConfirmModal } from './settings/DeleteConfirmModal';
import { TermsOfServiceModal, PrivacyPolicyModal } from '../features/legal';
import { ScientificCitationsModal } from './legal/ScientificCitationsModal';
import { MembershipPlansModal } from '../features/membership/MembershipPlansModal';
import { HelpCenterModal } from './settings/HelpCenterModal';
import { ContactSupportModal } from './settings/ContactSupportModal';
import { SendFeedbackModal } from './settings/SendFeedbackModal';
import { tactileEngine } from '../services/tactileEngine';
import { bluetoothSensorService } from '../services/bluetoothSensorService';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onLogout,
}) => {
  const s = useProductionSettings(onShowToast);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCitationsModal, setShowCitationsModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  if (!isOpen) return null;

  const handleDone = () => {
    tactileEngine.triggerSelectionBuzz();
    s.saveSettings();
    onClose();
  };

  const handlePairDevice = async () => {
    tactileEngine.triggerSelectionBuzz();
    s.setIsPairingDevice(true);
    onShowToast?.('Scanning for nearby BLE sensors...');
    const res = await bluetoothSensorService.requestAndConnect();
    s.setIsPairingDevice(false);
    if (res.success) {
      onShowToast?.(`Bluetooth device paired: ${res.deviceName}`);
    } else {
      onShowToast?.(res.error || 'Bluetooth pairing cancelled or timed out.');
    }
  };

  return (
    <div
      id="settings-slide-over-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200 select-none"
    >
      <div className="bg-black text-neutral-100 w-full max-w-[480px] max-h-[92dvh] h-auto rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all border border-white/[0.07]">
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 border-b border-white/[0.05] bg-o1-card/95 backdrop-blur-md shrink-0 min-h-[44px]">
          <button
            type="button"
            onClick={handleDone}
            className="flex items-center gap-0.5 text-neutral-400 hover:text-white p-1 -ml-1 transition-colors active:scale-95 cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <h2 className="font-tactical font-bold text-base text-neutral-100 leading-none">
            Profile &amp; Settings
          </h2>

          <button
            id="settings-done-btn"
            type="button"
            onClick={handleDone}
            className="text-o1-crimson hover:opacity-80 font-tactical font-semibold text-sm px-2 py-1 transition-colors active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-black p-3 space-y-2.5">
          <SettingsErrorBoundary>
            <SettingsContent
              s={s}
              onShowToast={onShowToast}
              onLogout={onLogout}
              onClose={onClose}
              onPairDevice={handlePairDevice}
              onOpenTutorial={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('o1fc_relaunch_onboarding'));
              }}
              onOpenHelpCenter={() => setShowHelpModal(true)}
              onOpenContactSupport={() => setShowContactModal(true)}
              onSendFeedback={() => setShowFeedbackModal(true)}
              onOpenTerms={() => setShowTermsModal(true)}
              onOpenPrivacy={() => setShowPrivacyModal(true)}
              onOpenCitations={() => setShowCitationsModal(true)}
              onOpenMembership={() => setShowMembershipModal(true)}
            />
          </SettingsErrorBoundary>
        </div>
      </div>

      <HelpCenterModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      <ContactSupportModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onShowToast={onShowToast}
      />

      <SendFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onShowToast={onShowToast}
      />

      <DeleteConfirmModal
        isOpen={s.showDeleteConfirm}
        isDeleting={s.isDeleting}
        onClose={() => s.setShowDeleteConfirm(false)}
        onConfirm={() => s.handleConfirmDelete(onLogout || onClose)}
      />

      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onDeleteRequest={() => {
          setShowPrivacyModal(false);
          s.setShowDeleteConfirm(true);
        }}
      />

      <ScientificCitationsModal
        isOpen={showCitationsModal}
        onClose={() => setShowCitationsModal(false)}
      />

      <MembershipPlansModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        onOpenTerms={() => { setShowMembershipModal(false); setShowTermsModal(true); }}
        onOpenPrivacy={() => { setShowMembershipModal(false); setShowPrivacyModal(true); }}
        onOpenDisclaimer={() => { setShowMembershipModal(false); setShowCitationsModal(true); }}
        onOpenHealth={() => { setShowMembershipModal(false); setShowCitationsModal(true); }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
export default SettingsModal;
