/**
 * Automatic country detection from browser locale / timezone.
 * Returns a 2-letter country code (e.g. 'AU', 'US', 'GB', 'DE').
 * No GPS, no permission prompt — purely locale/timezone based.
 */

const COUNTRY_NAMES_TO_CODES: Record<string, string> = {
  'united states': 'US',
  'united states of america': 'US',
  'australia': 'AU',
  'united kingdom': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'germany': 'DE',
  'france': 'FR',
  'canada': 'CA',
  'new zealand': 'NZ',
  'netherlands': 'NL',
  'spain': 'ES',
  'italy': 'IT',
  'portugal': 'PT',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'switzerland': 'CH',
  'austria': 'AT',
  'belgium': 'BE',
  'ireland': 'IE',
  'poland': 'PL',
  'japan': 'JP',
  'south korea': 'KR',
  'china': 'CN',
  'india': 'IN',
  'singapore': 'SG',
  'malaysia': 'MY',
  'thailand': 'TH',
  'indonesia': 'ID',
  'philippines': 'PH',
  'vietnam': 'VN',
  'brazil': 'BR',
  'mexico': 'MX',
  'argentina': 'AR',
  'south africa': 'ZA',
  'united arab emirates': 'AE',
  'saudi arabia': 'SA',
  'israel': 'IL',
  'turkey': 'TR',
  'greece': 'GR',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'hungary': 'HU',
  'romania': 'RO',
  'russia': 'RU',
  'ukraine': 'UA',
};

const TIMEZONE_COUNTRY_PREFIXES: Record<string, string> = {
  'America/': 'US',
  'Australia/': 'AU',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Amsterdam': 'NL',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Lisbon': 'PT',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT',
  'Europe/Brussels': 'BE',
  'Europe/Dublin': 'IE',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO',
  'Europe/Athens': 'GR',
  'Europe/Istanbul': 'TR',
  'Europe/Moscow': 'RU',
  'Europe/Kyiv': 'UA',
  'Europe/Kiev': 'UA',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Kolkata': 'IN',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Jerusalem': 'IL',
  'Pacific/Auckland': 'NZ',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  'Africa/Johannesburg': 'ZA',
};

const STORAGE_KEY = 'ofc_user_selected_country';

let cachedCountry: string | null = null;

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  regionName?: string;
}

export const POPULAR_COUNTRIES: CountryOption[] = [
  { code: 'GLOBAL', name: 'Global / All Markets', flag: '🌐', regionName: 'International' },
  { code: 'US', name: 'United States', flag: '🇺🇸', regionName: 'North America' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', regionName: 'Oceania' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', regionName: 'Europe' },
  { code: 'IN', name: 'India', flag: '🇮🇳', regionName: 'South Asia' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', regionName: 'North America' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', regionName: 'Europe' },
  { code: 'FR', name: 'France', flag: '🇫🇷', regionName: 'Europe' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', regionName: 'Oceania' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', regionName: 'Southeast Asia' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', regionName: 'East Asia' },
  { code: 'AE', name: 'UAE / Middle East', flag: '🇦🇪', regionName: 'Middle East' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', regionName: 'South America' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', regionName: 'North America' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', regionName: 'Africa' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', regionName: 'Europe' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', regionName: 'Europe' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', regionName: 'Europe' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', regionName: 'Southeast Asia' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', regionName: 'Southeast Asia' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', regionName: 'Southeast Asia' },
];

export const COUNTRY_POPULAR_TAGS: Record<string, string[]> = {
  AU: ['GYG', 'Woolworths', 'Coles', 'Maccas AU', 'YoPRO', 'Musashi', "Grill'd", 'Oporto', 'Tassal Salmon', 'Bulk Nutrients'],
  US: ['Chipotle', 'Chick-fil-A', 'Fairlife', "Trader Joe's", 'Kirkland', 'Quest', 'Oikos PRO', 'In-N-Out', "Dave's Killer Bread"],
  GB: ['Greggs', "Nando's", 'M&S Food', 'Tesco', "Sainsbury's", 'Grenade', 'Arla Protein', 'Pret A Manger'],
  IN: ['Amul Protein', 'Paneer', 'Dahi', 'Epigamia', 'MuscleBlaze', 'Sattu', 'Cult.fit', 'Tata Sampann', 'Soya Chunks'],
  CA: ['Tim Hortons', "President's Choice", 'Freshii', 'Popeyes CA', 'Bulk Barn', 'Biosteel', 'Fairlife CA'],
  DE: ['Rewe', 'Edeka', 'Ehrmann Protein', 'High Protein Quark', 'MyProtein DE', 'Lidl High Protein'],
  FR: ['Carrefour', 'Monoprix', 'Danone HiPRO', 'Fromage Blanc 0%', 'Poulet Rôti', 'Picard Bio'],
  NZ: ['Countdown', "Pak'nSave", 'Anchor Protein+', 'K-Roo', 'Meadow Fresh', 'Sanitarium'],
  SG: ['FairPrice', "Stuff'd", 'Crave', 'Meiji Protein', 'Cedele', '7-Eleven Protein'],
  AE: ['Almarai Protein', 'Spinneys', 'Carrefour ME', 'Zaatar w Zeit', 'Kcal Extra', 'Lulu Fresh'],
  GLOBAL: ['High Protein', 'Greek Yogurt', 'Chicken Breast', 'Whey Isolate', 'Eggs', 'Oats', 'Salmon', 'Rice'],
};

export function getCountryObj(code: string): CountryOption {
  return POPULAR_COUNTRIES.find((c) => c.code === code) || POPULAR_COUNTRIES[0];
}

export function getCountryTags(code: string): string[] {
  return COUNTRY_POPULAR_TAGS[code] || COUNTRY_POPULAR_TAGS.GLOBAL;
}

export function getSelectedCountry(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch (e) {
    // Non-fatal
  }
  return detectUserCountry();
}

export function setSelectedCountry(countryCode: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, countryCode);
    cachedCountry = countryCode;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ofc_country_changed', { detail: { country: countryCode } }));
    }
  } catch (e) {
    // Non-fatal
  }
}

export function subscribeCountryChange(callback: (code: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ country: string }>;
    if (custom.detail?.country) {
      callback(custom.detail.country);
    } else {
      callback(getSelectedCountry());
    }
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      cachedCountry = e.newValue;
      callback(e.newValue);
    }
  };
  window.addEventListener('ofc_country_changed', handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener('ofc_country_changed', handler);
    window.removeEventListener('storage', storageHandler);
  };
}

export function detectUserCountry(): string {
  if (cachedCountry) return cachedCountry;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      cachedCountry = saved;
      return saved;
    }
  } catch (e) {
    // Non-fatal
  }

  // 1. Try browser locale (navigator.language)
  try {
    const locale = navigator.language || (navigator as any).userLanguage || '';
    if (locale) {
      // Format: en-AU, en-US, de-DE, etc.
      const parts = locale.split('-');
      if (parts.length >= 2) {
        const code = parts[parts.length - 1].toUpperCase();
        if (code.length === 2 && code !== 'EN') {
          cachedCountry = code;
          return code;
        }
      }
      // Try regional locale variants
      const fullLocale = locale.toLowerCase();
      for (const [name, code] of Object.entries(COUNTRY_NAMES_TO_CODES)) {
        if (fullLocale.includes(name)) {
          cachedCountry = code;
          return code;
        }
      }
    }
  } catch (e) {
    // Non-fatal
  }

  // 2. Try timezone via Intl API
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (timezone) {
      // Direct match
      if (TIMEZONE_COUNTRY_PREFIXES[timezone]) {
        cachedCountry = TIMEZONE_COUNTRY_PREFIXES[timezone];
        return cachedCountry;
      }
      // Prefix match (e.g. America/Los_Angeles → US)
      for (const [prefix, code] of Object.entries(TIMEZONE_COUNTRY_PREFIXES)) {
        if (timezone.startsWith(prefix)) {
          cachedCountry = code;
          return code;
        }
      }
    }
  } catch (e) {
    // Non-fatal
  }

  // 3. Default fallback
  cachedCountry = 'US';
  return 'US';
}
