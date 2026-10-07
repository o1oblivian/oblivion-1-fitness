import React, { useEffect, useState } from 'react';
import { ExploreCoach, ExploreReelItem, EXPLORE_REELS_CATALOG } from '../../../data/reelsExploreCatalog';
import { supabase } from '../../../services/supabaseClient';
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
  const [livePrograms, setLivePrograms] = useState<CoachMarketplaceProgram[]>([]);

  useEffect(() => {
    if (!coach?.id) {
      setLivePrograms([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('coach_programs')
        .select('*')
        .or(`coach_id.eq.${coach.id},id.eq.${coach.id}`);
      if (cancelled || error || !Array.isArray(data)) return;
      setLivePrograms(
        data.map((row: any) => ({
          id: String(row.id),
          title: row.title || row.name || 'Program',
          coachId: row.coach_id || coach.id,
          price: row.price || row.rate || '',
          duration: row.duration || row.length || '',
          description: row.description || row.summary || '',
          ...row,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [coach?.id]);

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
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim text-neutral-100 font-sans select-none animate-in fade-in duration-200"
    >
      <div className="o1-sheet-card relative bg-o1-card border border-white/[0.07] text-neutral-100 flex flex-col overflow-hidden shadow-xl">
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-o1-well border border-white/[0.07] text-[11px] font-mono text-white shadow-xl">
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
          programs={livePrograms}
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
    </div>
  );
};
