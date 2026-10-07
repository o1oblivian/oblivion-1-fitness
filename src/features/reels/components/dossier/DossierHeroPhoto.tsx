import React from 'react';
import { ExploreCoach } from '../../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../../services/tactileEngine';

interface DossierHeroPhotoProps {
  coach: ExploreCoach;
  photoList: string[];
  activePhotoIdx: number;
  setActivePhotoIdx: (idx: number) => void;
  onOpenPhotoModal: (src: string) => void;
}

export const DossierHeroPhoto: React.FC<DossierHeroPhotoProps> = ({
  coach,
  photoList,
  activePhotoIdx,
  setActivePhotoIdx,
  onOpenPhotoModal,
}) => {
  return (
    <div
      className="relative aspect-[4/3] sm:aspect-[16/9] w-full bg-black overflow-hidden select-none cursor-pointer"
      onClick={() => onOpenPhotoModal(photoList[activePhotoIdx])}
    >
      <img
        src={photoList[activePhotoIdx]}
        alt={`${coach.name} portrait`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Featherweight hairline dash indicators - no background fog */}
      {photoList.length > 1 && (
        <div
          className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {photoList.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                tactileEngine.triggerLightTick();
                setActivePhotoIdx(idx);
              }}
              className={`h-0.5 rounded-full transition-all cursor-pointer ${
                idx === activePhotoIdx ? 'w-4 bg-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'w-1 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
