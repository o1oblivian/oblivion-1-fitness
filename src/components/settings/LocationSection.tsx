import React, { useState } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { useAuthStorage } from '../../hooks/useAuthStorage';
import { LiveLocationModal } from './LiveLocationModal';

interface LocationSectionProps {
  onOpenGymNetwork?: () => void;
  onOpenTravelPass?: () => void;
  triggerToast?: (msg: string) => void;
}

export function LocationSection({
  onOpenGymNetwork,
  onOpenTravelPass,
  triggerToast,
}: LocationSectionProps) {
  const { getProfile, updateProfile } = useAuthStorage();
  const profile = getProfile() || {};
  const [autoLocation, setAutoLocation] = useState(true);
  const [isLiveLocationOpen, setIsLiveLocationOpen] = useState(false);

  const homeGym = profile.home_gym || 'Melbourne, AU';

  const handleLocationSelected = (name: string, lat?: number, lng?: number) => {
    updateProfile({
      home_gym: name,
      latitude: lat,
      longitude: lng,
    });
  };

  return (
    <div>
      <SectionHeader title="Location & Travel" />
      <SettingsGroup>
        <SettingsRow
          label="Auto-Location"
          sublabel="Boost match accuracy with nearby athletes"
          rightElement={<ToggleSwitch checked={autoLocation} onChange={setAutoLocation} />}
        />

        <SettingsRow
          label="Home Gym / Base"
          sublabel="Live GPS & verified location search"
          value={homeGym}
          onClick={() => setIsLiveLocationOpen(true)}
        />

        {onOpenTravelPass && (
          <SettingsRow
            label="Travel Pass"
            sublabel="Access partner gym networks when traveling"
            value="Inactive"
            onClick={onOpenTravelPass}
          />
        )}
      </SettingsGroup>

      {/* Live Verified Location Modal */}
      <LiveLocationModal
        isOpen={isLiveLocationOpen}
        onClose={() => setIsLiveLocationOpen(false)}
        currentValue={homeGym}
        onSelectLocation={handleLocationSelected}
        triggerToast={triggerToast}
      />
    </div>
  );
}
export default LocationSection;
