import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Check, Navigation, Building2, X } from 'lucide-react';
import { useAuthStorage } from '../../hooks/useAuthStorage';
import { haversineKm } from '../../utils/gymNetworkStore';

interface LiveLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue?: string;
  onSelectLocation?: (locationName: string, lat?: number, lng?: number) => void;
  triggerToast?: (msg: string) => void;
}

export interface VerifiedLocationResult {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: 'gym' | 'place' | 'city';
}

export function LiveLocationModal({
  isOpen,
  onClose,
  currentValue,
  onSelectLocation,
  triggerToast,
}: LiveLocationModalProps) {
  const { getProfile, updateProfile } = useAuthStorage();
  const profile = getProfile() || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<VerifiedLocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Live query to OpenStreetMap Nominatim and Overpass for verified geocoded gyms & places
  const performLiveSearch = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Geocode search query to verified coordinates and addresses
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=7&addressdetails=1`;
      const resp = await fetch(geoUrl, {
        headers: { 'User-Agent': 'OFC-Official-App/1.0' },
      });

      if (resp.ok) {
        const data = await resp.json();
        const parsed: VerifiedLocationResult[] = data.map((item: any) => {
          const addr = item.address || {};
          const city =
            addr.suburb ||
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.county ||
            '';
          const country = addr.country || '';
          const name = item.name || item.display_name.split(',')[0];
          const fullAddress = [city, country].filter(Boolean).join(', ');

          return {
            id: `loc_${item.place_id || item.osm_id}`,
            name,
            address: fullAddress || item.display_name,
            city,
            country,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type === 'fitness_centre' || item.class === 'leisure' ? 'gym' : 'place',
          };
        });

        // 2. If the user is specifically searching for a gym name or city, also query nearby gyms if coords found
        if (parsed.length > 0 && (trimmed.toLowerCase().includes('gym') || trimmed.toLowerCase().includes('fitness'))) {
          const top = parsed[0];
          try {
            const overpassQuery = `
              [out:json][timeout:5];
              (
                node["leisure"="fitness_centre"](around:5000,${top.lat},${top.lng});
                node["amenity"="gym"](around:5000,${top.lat},${top.lng});
              );
              out center 5;
            `;
            const opResp = await fetch(
              `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
              { headers: { 'User-Agent': 'OFC-Official-App/1.0' } }
            );
            if (opResp.ok) {
              const opData = await opResp.json();
              const opGyms = (opData.elements || [])
                .filter((el: any) => el.tags?.name)
                .map((el: any) => ({
                  id: `osm_gym_${el.id}`,
                  name: el.tags.name,
                  address: `${el.tags['addr:street'] ? el.tags['addr:street'] + ', ' : ''}${top.city || ''}`,
                  city: top.city,
                  country: top.country,
                  lat: el.lat || el.center?.lat || top.lat,
                  lng: el.lon || el.center?.lon || top.lng,
                  type: 'gym' as const,
                }));
              setResults([...opGyms, ...parsed]);
              setIsLoading(false);
              return;
            }
          } catch {}
        }

        setResults(parsed);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.warn('[LiveLocationModal] Geocoding error:', e);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performLiveSearch(val);
    }, 320);
  };

  // One-tap GPS verification using device coordinates
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      triggerToast?.('Geolocation is not supported on this browser');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          // Reverse geocode to verified location string
          const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
          const resp = await fetch(revUrl, {
            headers: { 'User-Agent': 'OFC-Official-App/1.0' },
          });

          if (resp.ok) {
            const data = await resp.json();
            const addr = data.address || {};
            const suburbCity = addr.suburb || addr.city || addr.town || addr.village || 'Local Gym Hub';
            const stateCountry = [addr.state, addr.country_code?.toUpperCase()].filter(Boolean).join(', ');
            const verifiedName = `${suburbCity}, ${stateCountry}`;

            updateProfile({
              home_gym: verifiedName,
              latitude: lat,
              longitude: lng,
            });
            onSelectLocation?.(verifiedName, lat, lng);
            triggerToast?.(`Verified Base Location: ${verifiedName}`);
            onClose();
          } else {
            const fallback = `Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`;
            updateProfile({ home_gym: fallback, latitude: lat, longitude: lng });
            onSelectLocation?.(fallback, lat, lng);
            onClose();
          }
        } catch {
          const fallback = `Verified Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
          updateProfile({ home_gym: fallback, latitude: lat, longitude: lng });
          onSelectLocation?.(fallback, lat, lng);
          onClose();
        } finally {
          setIsLocatingGps(false);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        triggerToast?.('Unable to access device GPS. Please search for your city or gym.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelect = (item: VerifiedLocationResult) => {
    const formattedLocation = item.address ? `${item.name} (${item.address})` : item.name;
    updateProfile({
      home_gym: formattedLocation,
      latitude: item.lat,
      longitude: item.lng,
    });
    onSelectLocation?.(formattedLocation, item.lat, item.lng);
    triggerToast?.(`Home Gym updated to ${item.name}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Verified Base Location
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Live GPS & verified gym database lookup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Auto-GPS Button */}
        <div className="p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Search verified gym or city (e.g. Gold's Gym Venice, Melbourne CBD)..."
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-red-500"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600 animate-spin" />
            )}
          </div>

          <button
            type="button"
            onClick={handleUseCurrentGPS}
            disabled={isLocatingGps}
            className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isLocatingGps ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Acquiring Device GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Use Current Live GPS Location</span>
              </>
            )}
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[220px]">
          {currentValue && !searchQuery && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-600 dark:text-red-400" />
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Current Active Base
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {currentValue}
                  </span>
                </div>
              </div>
            </div>
          )}

          {results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between group cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-zinc-600 dark:text-zinc-300">
                    {item.type === 'gym' ? (
                      <Building2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate group-hover:text-red-600 dark:group-hover:text-red-400">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {item.address}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 shrink-0 ml-2 group-hover:text-zinc-900 dark:group-hover:text-white">
                  Select
                </span>
              </button>
            ))
          ) : searchQuery.length >= 2 && !isLoading ? (
            <div className="py-8 text-center">
              <Building2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                No verified location found for &quot;{searchQuery}&quot;
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Try searching a nearby major city, suburb, or tap &quot;Use Current Live GPS&quot;.
              </p>
            </div>
          ) : !searchQuery ? (
            <div className="py-6 text-center text-zinc-400 dark:text-zinc-500 space-y-1">
              <p className="text-xs font-medium">
                Type a gym franchise, club name, or city to find verified locations.
              </p>
              <p className="text-[10px] text-zinc-400">
                Prevents unverified / spoofed locations in Buddy Radar matching.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
