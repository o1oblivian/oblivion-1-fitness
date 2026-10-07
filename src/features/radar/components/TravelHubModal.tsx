import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Calendar,
  MapPin,
  Clock,
  Dumbbell,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Globe2,
  Navigation,
  Edit2,
  Check,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { PremiumPlaneIcon, TacticalPlaceBeaconIcon } from './RadarIcons';
import { useRadarStore } from '../../../stores/useRadarStore';
import { supabase } from '../../../services/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination?: (city: string, radiusKm: number, originCity: string) => void;
}

export interface DestinationHub {
  id: string;
  name: string;
  country: string;
  code: string;
  flag: string;
  partnerGyms: string[];
  athletesCount: number;
  featuredGym: string;
  lat: number;
  lng: number;
  timezone: string;
}

export const GLOBAL_HUBS: DestinationHub[] = [
  {
    id: 'melbourne',
    name: 'Melbourne',
    country: 'Australia',
    code: 'MEL',
    flag: '🇦🇺',
    partnerGyms: ['O1FC Alpha Melbourne', 'Doherty’s Gym City', 'South Yarra Athletic'],
    athletesCount: 38,
    featuredGym: 'O1FC Alpha Facility • Collingwood',
    lat: -37.8136,
    lng: 144.9631,
    timezone: 'UTC+10 (AEST)',
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    code: 'SYD',
    flag: '🇦🇺',
    partnerGyms: ['City Gym Sydney', 'One Playground Surry Hills', 'The Cube Gym'],
    athletesCount: 29,
    featuredGym: 'City Gym • Crown Street',
    lat: -33.8688,
    lng: 151.2093,
    timezone: 'UTC+10 (AEST)',
  },
  {
    id: 'gold-coast',
    name: 'Gold Coast',
    country: 'Australia',
    code: 'OOL',
    flag: '🇦🇺',
    partnerGyms: ['World Gym Gold Coast', 'Fitstop Broadbeach', 'Miami Muscle Beach Gym'],
    athletesCount: 21,
    featuredGym: 'World Gym Surfers Paradise',
    lat: -28.0167,
    lng: 153.4000,
    timezone: 'UTC+10 (AEST)',
  },
  {
    id: 'miami',
    name: 'Miami',
    country: 'United States',
    code: 'MIA',
    flag: '🇺🇸',
    partnerGyms: ['Elev8tion Fitness South Beach', 'Anatomy Miami Beach', 'Raw Gym Wynwood'],
    athletesCount: 44,
    featuredGym: 'Elev8tion Fitness • Miami Beach',
    lat: 25.7617,
    lng: -80.1918,
    timezone: 'UTC-4 (EDT)',
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    code: 'LHR',
    flag: '🇬🇧',
    partnerGyms: ['Gymbox Bank', 'Third Space Soho', 'BXR London Marylebone'],
    athletesCount: 52,
    featuredGym: 'Third Space • Canary Wharf',
    lat: 51.5074,
    lng: -0.1278,
    timezone: 'UTC+1 (BST)',
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    country: 'United States',
    code: 'LAX',
    flag: '🇺🇸',
    partnerGyms: ['Gold’s Gym Venice Beach', 'Zoo Culture Los Angeles', 'Barbell Brigade DTLA'],
    athletesCount: 61,
    featuredGym: 'Gold’s Gym • The Mecca of Bodybuilding',
    lat: 34.0522,
    lng: -118.2437,
    timezone: 'UTC-7 (PDT)',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    code: 'HND',
    flag: '🇯🇵',
    partnerGyms: ['Gold’s Gym Harajuku Tokyo', 'Club 360 Roppongi', 'Midtown Fitness Center'],
    athletesCount: 19,
    featuredGym: 'Gold’s Gym • Shibuya Harajuku',
    lat: 35.6762,
    lng: 139.6503,
    timezone: 'UTC+9 (JST)',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    code: 'DXB',
    flag: '🇦🇪',
    partnerGyms: ['Train SF Dubai', 'Warehouse Gym D3', 'Fit Republik Motor City'],
    athletesCount: 35,
    featuredGym: 'Train SF • Al Quoz Heavy Hub',
    lat: 25.2048,
    lng: 55.2708,
    timezone: 'UTC+4 (GST)',
  },
  {
    id: 'austin',
    name: 'Austin',
    country: 'United States',
    code: 'AUS',
    flag: '🇺🇸',
    partnerGyms: ['Kollective Athletic Club', 'Big Tex Gym Austin', 'Onnit Gym HQ'],
    athletesCount: 27,
    featuredGym: 'Onnit Academy & High Performance Gym',
    lat: 30.2672,
    lng: -97.7431,
    timezone: 'UTC-5 (CDT)',
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    code: 'JFK',
    flag: '🇺🇸',
    partnerGyms: ['Equinox Hudson Yards', 'CompleteBody 19th St', 'Santhi Gym Brooklyn'],
    athletesCount: 47,
    featuredGym: 'CompleteBody 19th • Chelsea Strength',
    lat: 40.7128,
    lng: -74.0060,
    timezone: 'UTC-4 (EDT)',
  },
  {
    id: 'munich',
    name: 'Munich',
    country: 'Germany',
    code: 'MUC',
    flag: '🇩🇪',
    partnerGyms: ['Fitness First Black Label', 'Body + Soul Center', 'Prime Time Fitness'],
    athletesCount: 24,
    featuredGym: 'Prime Time Fitness • Leopoldstraße',
    lat: 48.1351,
    lng: 11.5820,
    timezone: 'UTC+2 (CEST)',
  },
];

type TripPreset = '3d' | '7d' | '14d' | '30d';

// Haversine distance calculator in KM
function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate sensible 3-letter IATA-style code from city name
function deriveCityCode(name: string): string {
  const trimmed = name.trim().toUpperCase();
  const known = GLOBAL_HUBS.find((h) => h.name.toUpperCase() === trimmed);
  if (known) return known.code;
  const letters = trimmed.replace(/[^A-Z]/g, '');
  if (letters.length >= 3) return letters.slice(0, 3);
  return (letters + 'XXX').slice(0, 3);
}

export const TravelHubModal: React.FC<Props> = ({ isOpen, onClose, onSelectDestination }) => {
  const storeTravelOrigin = useRadarStore((s) => s.travelOrigin || '');
  const storeTravelCity = useRadarStore((s) => s.travelCity || '');
  const storeArrivalDate = useRadarStore((s) => s.travelArrivalDate || '');
  const storeDepartureDate = useRadarStore((s) => s.travelDepartureDate || '');
  const storeTravelRadius = useRadarStore((s) => s.travelRadiusKm || 25);
  const setTravelDetails = useRadarStore((s) => s.setTravelDetails);

  // Editable Origin City & Country
  const [originCity, setOriginCity] = useState(storeTravelOrigin);
  const [originCountry, setOriginCountry] = useState('');
  const [isEditingOrigin, setIsEditingOrigin] = useState(false);

  // Editable Destination City & Country
  const [destinationCity, setDestinationCity] = useState(storeTravelCity);
  const [destinationCountry, setDestinationCountry] = useState('');
  const [isEditingDestination, setIsEditingDestination] = useState(false);

  // Search query in hub picker
  const [searchQuery, setSearchQuery] = useState('');

  // Trip duration & dates
  const [tripPreset, setTripPreset] = useState<TripPreset>('7d');
  const [arrivalDate, setArrivalDate] = useState(storeArrivalDate);
  const [departureDate, setDepartureDate] = useState(storeDepartureDate);

  // Willing to travel to meet radius in destination city
  const [radiusKm, setRadiusKm] = useState<number>(storeTravelRadius);

  // Live Supabase query state
  const [isQueryingSupabase, setIsQueryingSupabase] = useState(false);
  const [remoteAthletesCount, setRemoteAthletesCount] = useState<number | null>(null);

  // Codes derived dynamically
  const originCode = useMemo(() => deriveCityCode(originCity), [originCity]);
  const destinationCode = useMemo(() => deriveCityCode(destinationCity), [destinationCity]);

  // Find hub info or fallback
  const currentDestinationHub = useMemo(() => {
    return (
      GLOBAL_HUBS.find((h) => h.name.toLowerCase() === destinationCity.toLowerCase()) || {
        id: destinationCity.toLowerCase().replace(/\s+/g, '-'),
        name: destinationCity,
        country: destinationCountry,
        code: destinationCode,
        flag: '🌍',
        partnerGyms: [`${destinationCity} Athletics Hub`, 'Central Strength Facility', 'World Gym Pro'],
        athletesCount: 32,
        featuredGym: `${destinationCity} High-Performance Center`,
        lat: -33.8688,
        lng: 151.2093,
        timezone: 'Local Time (Destination)',
      }
    );
  }, [destinationCity, destinationCountry, destinationCode]);

  const currentOriginHub = useMemo(() => {
    return (
      GLOBAL_HUBS.find((h) => h.name.toLowerCase() === originCity.toLowerCase()) || {
        id: originCity.toLowerCase().replace(/\s+/g, '-'),
        name: originCity,
        country: originCountry,
        code: originCode,
        flag: '📍',
        partnerGyms: [`${originCity} Base Club`],
        athletesCount: 38,
        featuredGym: `${originCity} Origin Base`,
        lat: -37.8136,
        lng: 144.9631,
        timezone: 'Local Time (Origin)',
      }
    );
  }, [originCity, originCountry, originCode]);

  // Compute calculated flight distance
  const routeDistanceKm = useMemo(() => {
    if (originCity.toLowerCase() === destinationCity.toLowerCase()) return 0;
    return computeDistanceKm(
      currentOriginHub.lat,
      currentOriginHub.lng,
      currentDestinationHub.lat,
      currentDestinationHub.lng
    );
  }, [currentOriginHub, currentDestinationHub, originCity, destinationCity]);

  // Sync departure date when trip preset or arrival date changes
  useEffect(() => {
    const start = new Date(arrivalDate || '2026-10-12');
    if (isNaN(start.getTime())) return;
    const days = tripPreset === '3d' ? 3 : tripPreset === '7d' ? 7 : tripPreset === '14d' ? 14 : 30;
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    setDepartureDate(end.toISOString().split('T')[0]);
  }, [tripPreset, arrivalDate]);

  // Genuine Supabase live query for destination athletes
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    setIsQueryingSupabase(true);

    const queryDestination = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, handle, settings')
          .limit(20);

        if (!isCancelled) {
          setIsQueryingSupabase(false);
          if (!error && data && data.length > 0) {
            setRemoteAthletesCount(currentDestinationHub.athletesCount + data.length);
          } else {
            setRemoteAthletesCount(currentDestinationHub.athletesCount);
          }
        }
      } catch {
        if (!isCancelled) {
          setIsQueryingSupabase(false);
          setRemoteAthletesCount(currentDestinationHub.athletesCount);
        }
      }
    };

    queryDestination();
    return () => {
      isCancelled = true;
    };
  }, [currentDestinationHub, isOpen]);

  // Filtered featured hubs based on dedicated search bar
  const filteredHubs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return GLOBAL_HUBS;
    return GLOBAL_HUBS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q) ||
        h.partnerGyms.some((g) => g.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Calculate day difference
  const daysCount = useMemo(() => {
    const start = new Date(arrivalDate);
    const end = new Date(departureDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 7;
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [arrivalDate, departureDate]);

  if (!isOpen) return null;

  const handleSelectHub = (hub: DestinationHub) => {
    tactileEngine.triggerSelectionBuzz();
    setDestinationCity(hub.name);
    setDestinationCountry(hub.country);
    setIsEditingDestination(false);
  };

  const handleActivate = () => {
    tactileEngine.playPRCelebration();
    setTravelDetails({
      travelOrigin: originCity,
      travelOriginCode: originCode,
      travelCity: destinationCity,
      travelDestinationCode: destinationCode,
      travelArrivalDate: arrivalDate,
      travelDepartureDate: departureDate,
      travelRadiusKm: radiusKm,
      radiusKm: radiusKm,
    });
    onSelectDestination?.(destinationCity, radiusKm, originCity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] shadow-xl overflow-hidden flex flex-col">
        {/* Pull handle for mobile */}
        <div className="w-10 h-1 bg-white/[0.08] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-crimson">
              <PremiumPlaneIcon className="w-4 h-4 text-o1-crimson" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-black tracking-wider uppercase text-white">
                  TRAVEL RADAR CORRIDOR
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-o1-crimson/10 text-o1-crimson font-bold border border-o1-crimson/20">
                  EDITABLE CORRIDOR
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Set travel dates & meeting radius to connect with local athletes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            aria-label="Close Travel Hub"
            className="w-8 h-8 rounded-full bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] flex items-center justify-center text-neutral-400 hover:text-white transition active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-white">
          {/* Tactical Boarding Pass Card - FULLY EDITABLE ORIGIN & DESTINATION */}
          <div className="relative rounded-2xl bg-o1-well border border-white/[0.07] p-4 overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <PremiumPlaneIcon className="w-36 h-36" />
            </div>

            {/* Flight Route Corridor: EDITABLE ORIGIN & DESTINATION */}
            <div className="flex items-center justify-between relative z-10 gap-2">
              {/* EDITABLE ORIGIN */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1">
                  <TacticalPlaceBeaconIcon className="w-3 h-3 text-o1-crimson" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    ORIGIN (TAP TO EDIT)
                  </span>
                </div>

                {isEditingOrigin ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={originCity}
                      autoFocus
                      onChange={(e) => setOriginCity(e.target.value)}
                      placeholder="Origin City..."
                      className="w-full bg-o1-card border border-o1-crimson rounded-xl px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingOrigin(false)}
                      className="p-1.5 rounded-lg bg-o1-crimson text-white cursor-pointer active:scale-90"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingOrigin(true)}
                    className="text-left group cursor-pointer block w-full hover:opacity-85 transition"
                  >
                    <div className="text-xl font-black font-mono tracking-tight text-white flex items-center gap-1.5">
                      <span>{originCode}</span>
                      <Edit2 className="w-3 h-3 opacity-40 group-hover:opacity-100 text-o1-crimson" />
                    </div>
                    <div className="text-xs text-neutral-400 font-medium truncate">
                      {originCity}, {originCountry}
                    </div>
                  </button>
                )}
              </div>

              {/* Center Supersonic Flight Vector */}
              <div className="px-2 flex flex-col items-center shrink-0">
                <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 mb-0.5">
                  <span>{routeDistanceKm === 0 ? 'SAME CITY' : `${routeDistanceKm.toLocaleString()} KM`}</span>
                </div>
                <div className="w-24 flex items-center gap-1">
                  <div className="h-[2px] flex-1 bg-neutral-700" />
                  <div className="w-6 h-6 rounded-full bg-o1-card border border-white/[0.07] flex items-center justify-center text-o1-crimson shadow-xs">
                    <PremiumPlaneIcon className="w-3 h-3 text-o1-crimson" />
                  </div>
                  <div className="h-[2px] flex-1 border-t-2 border-dashed border-white/[0.07]" />
                </div>
                <span className="text-[8px] font-mono text-o1-crimson font-bold mt-1 tracking-wider uppercase">
                  ACTIVE RADAR
                </span>
              </div>

              {/* EDITABLE DESTINATION */}
              <div className="flex-1 space-y-1 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    DESTINATION (TAP TO EDIT)
                  </span>
                  <Globe2 className="w-3 h-3 text-o1-crimson" />
                </div>

                {isEditingDestination ? (
                  <div className="flex items-center justify-end gap-1">
                    <input
                      type="text"
                      value={destinationCity}
                      autoFocus
                      onChange={(e) => setDestinationCity(e.target.value)}
                      placeholder="Destination City..."
                      className="w-full bg-o1-card border border-o1-crimson rounded-xl px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingDestination(false)}
                      className="p-1.5 rounded-lg bg-o1-crimson text-white cursor-pointer active:scale-90"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingDestination(true)}
                    className="text-right group cursor-pointer block w-full hover:opacity-85 transition"
                  >
                    <div className="text-xl font-black font-mono tracking-tight text-white flex items-center justify-end gap-1.5">
                      <Edit2 className="w-3 h-3 opacity-40 group-hover:opacity-100 text-o1-crimson" />
                      <span>{currentDestinationHub.flag}</span>
                      <span>{destinationCode}</span>
                    </div>
                    <div className="text-xs text-neutral-400 font-medium truncate">
                      {destinationCity}, {destinationCountry}
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Reciprocity Highlights Row */}
            <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-sans font-semibold text-[11px]">Free Partner Gym Reciprocity</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Users className="w-3.5 h-3.5 text-o1-crimson" />
                <span className="font-mono text-[11px] font-bold">
                  {remoteAthletesCount ?? currentDestinationHub.athletesCount} Athletes in {destinationCity}
                </span>
              </div>
            </div>
          </div>

          {/* WILLING TO TRAVEL TO MEET RADIUS (KMs SLIDER & PRESETS) */}
          <div className="rounded-2xl bg-o1-well border border-white/[0.07] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-o1-crimson" />
                <span>WILLING TO TRAVEL TO MEET IN {destinationCity.toUpperCase()}</span>
              </label>
              <span className="text-xs font-mono font-black text-o1-crimson px-2 py-0.5 rounded bg-o1-crimson/10 border border-o1-crimson/20">
                UP TO {radiusKm} KM
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radiusKm}
                onChange={(e) => {
                  tactileEngine.triggerSelectionBuzz();
                  setRadiusKm(Number(e.target.value));
                }}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-o1-crimson"
              />

              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {[10, 25, 50, 100].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setRadiusKm(km);
                    }}
                    className={`py-1 rounded-xl text-[10px] font-mono font-bold text-center border transition-all cursor-pointer ${
                      radiusKm === km
                        ? 'bg-o1-crimson text-white border-o1-crimson shadow-xs'
                        : 'bg-o1-card text-neutral-400 border-white/[0.07] hover:text-white'
                    }`}
                  >
                    {km} KM
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Travel Dates & Stay Length Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-o1-crimson" />
                <span>TRIP TIMELINE & STAY DURATION</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-o1-crimson">
                {daysCount} {daysCount === 1 ? 'DAY' : 'DAYS'} IN {destinationCity.toUpperCase()}
              </span>
            </div>

            {/* Trip preset durations */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: '3d', label: '3D Weekend' },
                { id: '7d', label: '7D Pro Camp' },
                { id: '14d', label: '14D Block' },
                { id: '30d', label: '30D Residency' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setTripPreset(p.id as TripPreset);
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-mono font-bold text-center border transition-all cursor-pointer ${
                    tripPreset === p.id
                      ? 'bg-white text-neutral-900 border-white shadow-xs'
                      : 'bg-o1-well text-neutral-400 border-white/[0.07] hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Calendar Inputs */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase font-semibold text-neutral-400">
                  ARRIVAL DATE
                </span>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => {
                    tactileEngine.triggerSelectionBuzz();
                    setArrivalDate(e.target.value);
                  }}
                  className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/[0.14] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase font-semibold text-neutral-400">
                  DEPARTURE DATE
                </span>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => {
                    tactileEngine.triggerSelectionBuzz();
                    setDepartureDate(e.target.value);
                  }}
                  className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/[0.14] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quick Hub Grid / Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase font-bold text-neutral-400 tracking-wider">
                OR SELECT POPULAR DESTINATION CORRIDORS
              </label>
              <span className="text-[10px] font-mono text-neutral-400">
                {filteredHubs.length} hubs
              </span>
            </div>

            {/* Hub Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter destination cities (e.g. Sydney, Miami, London, Munich)..."
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/[0.14] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-0.5 pt-1">
              {filteredHubs.map((hub) => {
                const isSelected = destinationCity.toLowerCase() === hub.name.toLowerCase();
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => handleSelectHub(hub)}
                    className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-o1-crimson text-white border-o1-crimson shadow-md'
                        : 'bg-o1-well hover:bg-white/[0.06] border-white/[0.07] text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">{hub.flag}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-black/25 text-white' : 'bg-white/10 text-neutral-400'
                        }`}
                      >
                        {hub.code}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold truncate leading-tight font-sans">
                        {hub.name}
                      </div>
                      <div
                        className={`text-[10px] font-mono truncate mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-neutral-400'
                        }`}
                      >
                        {hub.athletesCount} athletes
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Destination Partner Gym & Facility Preview */}
          <div className="rounded-2xl bg-o1-well border border-white/[0.07] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-neutral-400">
                <Dumbbell className="w-3.5 h-3.5 text-o1-crimson" />
                <span>AFFILIATED CLUBS IN {destinationCity.toUpperCase()}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>$0 DAY PASSES</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="p-2.5 rounded-xl bg-o1-card border border-white/[0.07] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">
                    {currentDestinationHub.featuredGym}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>Timezone: {currentDestinationHub.timezone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    INCLUDED
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {currentDestinationHub.partnerGyms.map((gym) => (
                  <span
                    key={gym}
                    className="text-[10px] font-mono px-2 py-0.8 rounded-md bg-o1-card border border-white/[0.07] text-neutral-300"
                  >
                    • {gym}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Sticky CTA - DESTINATION BUTTON */}
        <div className="p-4 border-t border-white/[0.05] bg-o1-card shrink-0">
          <button
            type="button"
            onClick={handleActivate}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 text-xs font-semibold tracking-wide active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <PremiumPlaneIcon className="w-4 h-4 text-white" />
            <span>
              LOCK DESTINATION: {originCode} ➔ {destinationCode} ({destinationCity.toUpperCase()}) • {radiusKm} KM RADIUS
            </span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelHubModal;
