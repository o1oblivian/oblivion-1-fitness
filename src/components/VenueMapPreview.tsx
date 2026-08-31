import React, { useState, useMemo } from 'react';
import { GymVenue } from '../utils/gymNetworkStore';
import { ZoomIn, ZoomOut, RefreshCw, Compass, MapPin, Sparkles, Flame, ExternalLink, X } from 'lucide-react';

interface VenueMapPreviewProps {
  venues: GymVenue[];
  selectedVenueId?: string | null;
  onSelectVenue?: (venue: GymVenue) => void;
  onCheckIn?: (venueId: string) => void;
  onBuyPass?: (venue: GymVenue) => void;
  userCoords?: { lat: number; lng: number } | null;
  onDetectGPS?: () => void;
}

export const VenueMapPreview: React.FC<VenueMapPreviewProps> = ({
  venues,
  selectedVenueId,
  onSelectVenue,
  onCheckIn,
  onBuyPass,
  userCoords,
  onDetectGPS,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredVenueId, setHoveredVenueId] = useState<string | null>(null);
  const [activePinPopupId, setActivePinPopupId] = useState<string | null>(null);

  // Compute map bounds and normalized pin positions
  const pinPositions = useMemo(() => {
    if (!venues || venues.length === 0) return [];

    const validVenues = venues.filter((v) => typeof v.lat === 'number' && typeof v.lng === 'number');
    
    // Find min / max lat lng
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    validVenues.forEach((v) => {
      if (v.lat !== 0 && v.lng !== 0) {
        if (v.lat < minLat) minLat = v.lat;
        if (v.lat > maxLat) maxLat = v.lat;
        if (v.lng < minLng) minLng = v.lng;
        if (v.lng > maxLng) maxLng = v.lng;
      }
    });

    const isSinglePoint = minLat === maxLat || minLng === maxLng;

    return venues.map((v, index) => {
      let x = 50;
      let y = 50;

      if (v.lat !== 0 && v.lng !== 0 && !isSinglePoint) {
        // Map longitude to X percentage (12% to 88%)
        const lngRange = maxLng - minLng || 1;
        x = ((v.lng - minLng) / lngRange) * 74 + 13;

        // Map latitude to Y percentage (15% to 85%) (inverted, as higher lat is north)
        const latRange = maxLat - minLat || 1;
        y = ((maxLat - v.lat) / latRange) * 68 + 16;
      } else {
        // Arrange in pleasant ring grid if lat/lng missing or single point
        const total = venues.length;
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        const radius = total > 1 ? 30 : 0;
        x = 50 + radius * Math.cos(angle);
        y = 50 + radius * Math.sin(angle);
      }

      return {
        venue: v,
        x: Math.max(10, Math.min(90, x)),
        y: Math.max(12, Math.min(88, y)),
      };
    });
  }, [venues]);

  const activeVenue = venues.find((v) => v.id === (activePinPopupId || selectedVenueId)) || null;

  const getCategoryTheme = (category?: string) => {
    switch (category) {
      case 'Yoga':
        return { icon: '', color: '#7A9382', bg: 'bg-[#7A9382]/20', border: 'border-[#7A9382]' };
      case 'Spa':
        return { icon: '', color: '#E5A93C', bg: 'bg-[#E5A93C]/20', border: 'border-[#E5A93C]' };
      case 'Sauna':
        return { icon: '', color: '#A855F7', bg: 'bg-[#A855F7]/20', border: 'border-[#A855F7]' };
      case 'Sports':
        return { icon: '', color: '#06B6D4', bg: 'bg-[#06B6D4]/20', border: 'border-[#06B6D4]' };
      default:
        return { icon: '', color: '#DC2626', bg: 'bg-[#DC2626]/20', border: 'border-[#DC2626]' };
    }
  };

  return (
    <div className="w-full bg-[#12151C] text-white rounded-3xl border border-[rgba(0,0,0,0.08)]/20 dark:border-white/15 overflow-hidden shadow-xl relative font-mono select-none my-2">
      {/* MAP CONTROL BAR */}
      <div className="px-4 py-2.5 bg-[#1A1E29] border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-bold text-white text-[11px] tracking-wide flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Interactive Venue Radar Map</span>
          </span>
          <span className="text-[10px] text-gray-400 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
            {venues.length} Pins Found
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.3))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.3))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setActivePinPopupId(null);
            }}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Reset Map"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {onDetectGPS && (
            <button
              onClick={onDetectGPS}
              className="px-2.5 py-1 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Compass className="w-3 h-3" />
              <span>GPS</span>
            </button>
          )}
        </div>
      </div>

      {/* CANVAS MAP CONTAINER */}
      <div className="relative w-full h-[230px] sm:h-[270px] bg-[#0B0D13] overflow-hidden">
        {/* WORLD/RADAR SVG GRAPHICS BACKGROUND */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg className="w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="1.5" fill="rgba(217,79,79,0.4)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Radar concentric scanning circles */}
            <circle cx="50%" cy="50%" r="35%" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="20%" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="6 6" />
          </svg>

          {/* User GPS Ripple Marker */}
          {userCoords && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{ left: '50%', top: '50%' }}
            >
              <div className="w-5 h-5 rounded-full bg-cyan-400/30 border-2 border-cyan-400 flex items-center justify-center" />
              <div className="w-3 h-3 rounded-full bg-cyan-400 absolute inset-1 border border-black shadow-md" />
            </div>
          )}

          {/* VENUE PINS */}
          {pinPositions.map(({ venue, x, y }) => {
            const isSelected = venue.id === selectedVenueId || venue.id === activePinPopupId;
            const isHovered = venue.id === hoveredVenueId;
            const theme = getCategoryTheme(venue.category);

            return (
              <div
                key={venue.id}
                onClick={() => {
                  setActivePinPopupId(venue.id);
                  if (onSelectVenue) onSelectVenue(venue);
                }}
                onMouseEnter={() => setHoveredVenueId(venue.id)}
                onMouseLeave={() => setHoveredVenueId(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-all duration-200"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {/* Glowing ring if selected/hovered */}
                {(isSelected || isHovered) && (
                  <div
                    className="absolute -inset-2 rounded-full opacity-80"
                    style={{ backgroundColor: `${theme.color}40`, border: `1.5px solid ${theme.color}` }}
                  />
                )}

                {/* PIN BADGE */}
                <div
                  className={`relative px-2 py-1 rounded-xl font-black text-[10px] flex items-center gap-1 shadow-lg border transition-all transform ${
                    isSelected
                      ? 'scale-125 z-30 bg-white text-black border-white shadow-2xl ring-2 ring-[#DC2626]'
                      : 'bg-[#1A1E29] text-white hover:scale-110 border-white/20'
                  }`}
                  style={{
                    borderColor: isSelected ? '#FFFFFF' : theme.color,
                  }}
                >
                  <span className="text-[11px]">{theme.icon}</span>
                  <span className="truncate max-w-[80px] font-extrabold">{venue.name.split(' ')[0]}</span>
                  {venue.is_partner && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Partner Facility" />
                  )}
                </div>

                {/* Pin stem arrow */}
                <div
                  className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] mx-auto -mt-0.5"
                  style={{ borderTopColor: isSelected ? '#FFFFFF' : theme.color }}
                />
              </div>
            );
          })}
        </div>

        {/* FLOATING ACTIVE PIN DETAIL CARD / POPOVER */}
        {activeVenue && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-xs z-40 bg-[#1A1E29]/95 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm">{getCategoryTheme(activeVenue.category).icon}</span>
                <h5 className="font-bold text-xs text-white truncate">{activeVenue.name}</h5>
              </div>
              <button
                onClick={() => setActivePinPopupId(null)}
                className="text-gray-400 hover:text-white text-xs px-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-gray-300 font-semibold truncate mb-1.5 flex items-center gap-1">
              <span className="truncate">{activeVenue.address}</span>
            </p>

            <div className="flex items-center gap-2 text-[9px] mb-2.5">
              <span className="bg-[#DC2626]/20 text-[#DC2626] px-1.5 py-0.5 rounded border border-[#DC2626]/30 uppercase font-bold">
                {activeVenue.category || 'Gym'}
              </span>
              {activeVenue.city && (
                <span className="bg-white/10 text-gray-200 px-1.5 py-0.5 rounded">
                  {activeVenue.city}, {activeVenue.country}
                </span>
              )}
              {activeVenue.active_checkins_count > 0 && (
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-emerald-400" />
                  {activeVenue.active_checkins_count} Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
              {onCheckIn && (
                <button
                  onClick={() => {
                    onCheckIn(activeVenue.id);
                    setActivePinPopupId(null);
                  }}
                  className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white font-bold text-[10.5px] rounded-xl transition-all cursor-pointer text-center"
                >
                  Check-In
                </button>
              )}
              {onBuyPass && (
                <button
                  onClick={() => {
                    onBuyPass(activeVenue);
                    setActivePinPopupId(null);
                  }}
                  className="flex-1 py-1.5 px-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-[10.5px] rounded-xl transition-all cursor-pointer shadow-xs text-center"
                >
                  Pass (${activeVenue.pass_price_aud ? activeVenue.pass_price_aud.toFixed(2) : '14.99'})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
