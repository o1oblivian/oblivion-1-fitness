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
  const { profile, updateProfile } = useAuthStorage();
  const autoLocation = profile.auto_location_enabled !== false;
  const [isLiveLocationOpen, setIsLiveLocationOpen] = useState(false);

  const homeGym = profile.home_gym || 'Melbourne, AU';

  const handleToggleAutoLocation = (nextVal: boolean) => {
    if (nextVal) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            updateProfile({
              auto_location_enabled: true,
              latitude,
              longitude,
            });
            triggerToast?.(`Live GPS synchronized (±${Math.round(accuracy)}m)`);
          },
          () => {
            updateProfile({ auto_location_enabled: true });
            triggerToast?.('Auto-Location enabled');
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        updateProfile({ auto_location_enabled: true });
        triggerToast?.('Auto-Location enabled');
      }
    } else {
      updateProfile({ auto_location_enabled: false });
      triggerToast?.('Auto-Location disabled (Static base active)');
    }
  };

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
          rightElement={<ToggleSwitch checked={autoLocation} onChange={handleToggleAutoLocation} />}
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
