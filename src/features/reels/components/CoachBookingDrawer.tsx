import React, { useState } from 'react';
import { ExploreCoach, ExploreReelItem, EXPLORE_REELS_CATALOG } from '../../../data/reelsExploreCatalog';
import { COACH_MARKETPLACE_PROGRAMS } from '../../coach/data/coachMarketplaceData';
import { ProgramCheckoutModal } from '../../coach/components/ProgramCheckoutModal';
import { CoachMarketplaceProgram } from '../../coach/types/coachPlatformTypes';
import { DossierHeader } from './dossier/DossierHeader';
import { DossierHeroPhoto } from './dossier/DossierHeroPhoto';
import { DossierTabContent } from './dossier/DossierTabContent';
import { DossierPhotoModal } from './dossier/DossierPhotoModal';

export interface CoachBookingDrawerProps {
  coach: ExploreCoach | null;
  onClose: () => void;
  onSelectReel?: (reel: ExploreReelItem) => void;
  onMessageCoach?: (coach: ExploreCoach) => void;
  isFollowing?: boolean;
  onToggleFollow?: (coachId: string) => void;
}

export const CoachBookingDrawer: React.FC<CoachBookingDrawerProps> = ({
  coach,
  onClose,
  onSelectReel,
}) => {
  const [activeTab, setActiveTab] = useState<'physique' | 'programs' | 'coaching'>('physique');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<CoachMarketplaceProgram | null>(null);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  if (!coach) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const photoList = coach.physiquePhotos && coach.physiquePhotos.length > 0
    ? coach.physiquePhotos
    : [coach.avatar];

  const coachReels = EXPLORE_REELS_CATALOG.filter((r) => r?.coach?.id === coach?.id);
  const displayReels = coachReels.length > 0 ? coachReels : EXPLORE_REELS_CATALOG.slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: coach.name, text: coach.bio, url: window.location.href }).catch(() => {});
    } else {
      showToast('Profile link copied to clipboard');
    }
  };

  return (
    <div
      id="coach-athletic-dossier-modal"
      className="fixed inset-0 z-50 bg-[#09090b] text-neutral-100 flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-200"
    >
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-neutral-900/90 border border-white/10 text-[11px] font-mono text-white shadow-xl">
          {toastMessage}
        </div>
      )}

      {/* Floating minimal back/share controls directly on the hero image */}
      <DossierHeader onClose={onClose} onShare={handleShare} />

      {/* Unobstructed, serene profile view (Zero sticky bottom red bar) */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <DossierHeroPhoto
          coach={coach}
          photoList={photoList}
          activePhotoIdx={activePhotoIdx}
          setActivePhotoIdx={setActivePhotoIdx}
          onOpenPhotoModal={setSelectedPhotoModal}
        />

        <DossierTabContent
          coach={coach}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          programs={COACH_MARKETPLACE_PROGRAMS}
          displayReels={displayReels}
          onSelectReel={onSelectReel}
          onSelectProgram={setSelectedProgram}
          showToast={showToast}
        />
      </div>

      <ProgramCheckoutModal
        program={selectedProgram}
        isOpen={Boolean(selectedProgram)}
        onClose={() => setSelectedProgram(null)}
        onEnrollSuccess={(prog) => {
          showToast(`Enrolled in ${prog.title}! Dispatched to Workout.`);
          setSelectedProgram(null);
        }}
      />

      <DossierPhotoModal photo={selectedPhotoModal} onClose={() => setSelectedPhotoModal(null)} />
    </div>
  );
};
