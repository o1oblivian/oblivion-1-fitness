import { BuddyProfile, DISCIPLINES, TIME_SLOTS } from './buddyRadarStore';

export interface GlobalCityHub {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  gyms: Array<{
    name: string;
    address: string;
    category: string;
    lat: number;
    lng: number;
  }>;
}

export const GLOBAL_CITY_HUBS: GlobalCityHub[] = [
  {
    id: 'nyc',
    name: 'New York City',
    country: 'United States',
    lat: 40.7128,
    lng: -74.0060,
    gyms: [
      { name: 'Equinox Hudson Yards', address: '32 Hudson Yards, New York, NY 10001', category: 'Luxury Athletic', lat: 40.7538, lng: -74.0022 },
      { name: 'Mid-City Barbell Club', address: '244 W 54th St, New York, NY 10019', category: 'Powerlifting & Iron', lat: 40.7645, lng: -73.9832 },
      { name: 'DUMBO Strength & Conditioning', address: '55 Washington St, Brooklyn, NY 11201', category: 'Functional & Calisthenics', lat: 40.7033, lng: -73.9892 },
      { name: 'Chelsea Piers Fitness', address: '60 Chelsea Piers, New York, NY 10011', category: 'Multi-Sport Complex', lat: 40.7468, lng: -74.0089 },
      { name: 'Overthrow Boxing Club', address: '9 Bleecker St, New York, NY 10012', category: 'Combat & HIIT', lat: 40.7251, lng: -73.9930 },
    ],
  },
  {
    id: 'ldn',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    gyms: [
      { name: 'Third Space Soho', address: '67 Sherwood St, London W1F 7BR', category: 'Elite Athletic & Recovery', lat: 51.5115, lng: -0.1370 },
      { name: 'Gymbox Bank', address: '71 Lombard St, London EC3V 9AY', category: 'Combat & Functional', lat: 51.5126, lng: -0.0864 },
      { name: 'BXR London Marylebone', address: '24 Paddington St, London W1U 5QY', category: 'Championship Boxing & Strength', lat: 51.5199, lng: -0.1548 },
      { name: 'Commando Temple Deptford', address: '16 Resolution Way, London SE8 4NT', category: 'Strongman & Calisthenics', lat: 51.4789, lng: -0.0261 },
      { name: 'Canary Wharf Health & Racquets', address: 'Cabot Square, London E14 4PZ', category: 'Corporate Performance', lat: 51.5048, lng: -0.0205 },
    ],
  },
  {
    id: 'tyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    gyms: [
      { name: "Gold's Gym Harajuku Tokyo", address: '6-31-17 Jingumae, Shibuya-ku, Tokyo', category: 'Bodybuilding & Heavy Iron', lat: 35.6692, lng: 139.7032 },
      { name: 'Mori Building Roppongi Hills Club Gym', address: '6-10-1 Roppongi, Minato-ku, Tokyo', category: 'Executive Fitness', lat: 35.6605, lng: 139.7292 },
      { name: 'Reebok CrossFit Heart & Beauty', address: '3-13-8 Nishi-Azabu, Minato-ku, Tokyo', category: 'CrossFit & Conditioning', lat: 35.6591, lng: 139.7228 },
      { name: 'Shinjuku Barbell Alliance', address: '1-2-3 Kabukicho, Shinjuku-ku, Tokyo', category: 'Olympic Lifting', lat: 35.6948, lng: 139.7031 },
      { name: 'Anytime Fitness Shibuya', address: '1-14-14 Dogenzaka, Shibuya-ku, Tokyo', category: '24/7 Functional', lat: 35.6580, lng: 139.6975 },
    ],
  },
  {
    id: 'lax',
    name: 'Los Angeles',
    country: 'United States',
    lat: 34.0522,
    lng: -118.2437,
    gyms: [
      { name: "Gold's Gym Venice (The Mecca)", address: '360 Hampton Dr, Venice, CA 90291', category: 'Historic Bodybuilding', lat: 33.9922, lng: -118.4735 },
      { name: 'Barbell Brigade Downtown LA', address: '1633 S Hope St, Los Angeles, CA 90015', category: 'Powerlifting & Domination', lat: 34.0371, lng: -118.2642 },
      { name: 'Dogtown CrossFit Culver City', address: '3570 Hayden Ave, Culver City, CA 90232', category: 'MetCon & Endurance', lat: 34.0253, lng: -118.3789 },
      { name: 'Equinox Sports Club West LA', address: '1835 Sepulveda Blvd, Los Angeles, CA 90025', category: 'High-Performance Training', lat: 34.0435, lng: -118.4412 },
      { name: 'Wild Card Boxing Gym Hollywood', address: '1123 N Vine St, Los Angeles, CA 90038', category: 'Championship Boxing', lat: 34.0917, lng: -118.3267 },
    ],
  },
  {
    id: 'syd',
    name: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lng: 151.2093,
    gyms: [
      { name: 'Iron Works Barbell HQ', address: '15 Bridge Road, Glebe, NSW 2037', category: 'Powerlifting & Heavy Iron', lat: -33.8789, lng: 151.1872 },
      { name: 'FitLab Central Metro', address: '240 George St, Sydney, NSW 2000', category: 'Commercial & Functional', lat: -33.8631, lng: 151.2078 },
      { name: 'Bondi Outdoor Gym & Calisthenics Park', address: 'Queen Elizabeth Dr, Bondi Beach, NSW 2026', category: 'Beachfront Calisthenics', lat: -33.8915, lng: 151.2767 },
      { name: 'PowerHouse Strength Surry Hills', address: '88 Campbell Ave, Surry Hills, NSW 2010', category: 'Bodybuilding & Hypertrophy', lat: -33.8821, lng: 151.2114 },
      { name: 'CrossFit Bondi Junction', address: '33 Bronte Rd, Bondi Junction, NSW 2022', category: 'CrossFit & Conditioning', lat: -33.8932, lng: 151.2489 },
    ],
  },
  {
    id: 'dxb',
    name: 'Dubai',
    country: 'United Arab Emirates',
    lat: 25.2048,
    lng: 55.2708,
    gyms: [
      { name: 'Binous Gym Al Quoz', address: 'Street 4B, Al Quoz 1, Dubai', category: 'Massive Hypertrophy Warehouse', lat: 25.1485, lng: 55.2312 },
      { name: 'Warehouse Gym DIFC', address: 'Gate Building, DIFC, Dubai', category: 'Urban Design & Functional', lat: 25.2091, lng: 55.2798 },
      { name: 'TK MMA & Fitness Media City', address: 'Shatha Tower, Media City, Dubai', category: 'Combat & Conditioning', lat: 25.0934, lng: 55.1542 },
      { name: 'UFC Gym Business Bay', address: 'Building 1, Bay Square, Dubai', category: 'Mixed Martial Arts', lat: 25.1875, lng: 55.2815 },
      { name: 'Fit Republik Sports City', address: 'Dubai Sports City, Dubai', category: 'Olympic Weightlifting & Gymnastics', lat: 25.0421, lng: 55.2189 },
    ],
  },
  {
    id: 'par',
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    gyms: [
      { name: "L'Usine Opéra", address: '8 Rue de la Michodière, 75002 Paris', category: 'Haute Performance & Strength', lat: 48.8701, lng: 2.3338 },
      { name: 'CrossFit Louvre', address: '31 Rue Croix des Petits Champs, 75001 Paris', category: 'CrossFit & MetCon', lat: 48.8643, lng: 2.3391 },
      { name: 'Apollo Sporting Club 11e', address: '29 Rue Jacques Louvel-Tessier, 75010 Paris', category: 'Boxing & Functional', lat: 48.8712, lng: 2.3685 },
      { name: 'Fitness Park République', address: '5 Place de la République, 75003 Paris', category: 'Heavy Iron & Machines', lat: 48.8675, lng: 2.3639 },
      { name: 'Club Med Gym Saint-Lazare', address: '44 Rue Saint-Lazare, 75009 Paris', category: 'Comprehensive Athletic', lat: 48.8765, lng: 2.3341 },
    ],
  },
  {
    id: 'sin',
    name: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    gyms: [
      { name: 'The Strength Yard Geylang', address: '369 Joo Chiat Rd, Singapore 427614', category: 'Powerlifting & Strength', lat: 1.3092, lng: 103.9038 },
      { name: 'Virgin Active Marina One', address: '7 Straits View, Singapore 018936', category: 'Executive High-Tech Training', lat: 1.2778, lng: 103.8532 },
      { name: 'Mobilus Chinatown CrossFit', address: '20 Upper Circular Rd, Singapore 058416', category: 'CrossFit & Gymnastics', lat: 1.2885, lng: 103.8471 },
      { name: 'Anytime Fitness Tanjong Pagar', address: '1 Tras Link, Orchid Hotel, Singapore 078867', category: '24/7 Conditioning', lat: 1.2762, lng: 103.8435 },
      { name: 'Evolve MMA Far East Square', address: '26 China St, Singapore 049568', category: 'World Championship Martial Arts', lat: 1.2839, lng: 103.8489 },
    ],
  },
  {
    id: 'ber',
    name: 'Berlin',
    country: 'Germany',
    lat: 52.5200,
    lng: 13.4050,
    gyms: [
      { name: 'Berlin Strength Friedrichshain', address: 'Revaler Str. 99, 10245 Berlin', category: 'Powerlifting, Strongman & Vegan Iron', lat: 52.5072, lng: 13.4531 },
      { name: 'Hard Candy Fitness Mitte', address: 'Friedrichstraße 89, 10117 Berlin', category: 'Athletic Hypertrophy', lat: 52.5189, lng: 13.3892 },
      { name: 'CrossFit Aorta Kreuzberg', address: 'Görlitzer Str. 52, 10997 Berlin', category: 'MetCon & Endurance', lat: 52.4975, lng: 13.4398 },
      { name: 'Spitfire Gym Neukölln', address: 'Karl-Marx-Str. 142, 12043 Berlin', category: 'MMA, Muay Thai & Conditioning', lat: 52.4789, lng: 13.4385 },
      { name: 'John Reed Fitness Kreuzberg', address: 'Köpenicker Str. 18, 10997 Berlin', category: 'Art & Underground Lifting', lat: 52.5015, lng: 13.4342 },
    ],
  },
  {
    id: 'tor',
    name: 'Toronto',
    country: 'Canada',
    lat: 43.6532,
    lng: -79.3832,
    gyms: [
      { name: 'Fortis Fitness Leslieville', address: '11 Carlaw Ave, Toronto, ON M4M 2R6', category: '24/7 Heavy Iron & Powerlifting', lat: 43.6582, lng: -79.3402 },
      { name: 'Adelaide Club Financial District', address: '1 First Canadian Place, Toronto, ON M5X 1C7', category: 'Executive Athletic Club', lat: 43.6489, lng: -79.3815 },
      { name: 'Academy Of Lions Queen West', address: '64 Ossington Ave, Toronto, ON M6J 2Y7', category: 'CrossFit, Running & Community', lat: 43.6472, lng: -79.4201 },
      { name: 'Bang Fitness King West', address: '610 Queen St W, Toronto, ON M6J 1E3', category: 'Kettlebells & Movement', lat: 43.6481, lng: -79.4082 },
      { name: 'Toronto BJJ Bloorcourt', address: '813 Bloor St W, Toronto, ON M6G 1L8', category: 'Jiu Jitsu & Strength', lat: 43.6625, lng: -79.4278 },
    ],
  },
];

export interface BuddyActivityHistoryItem {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  type: 'solo_workout' | 'buddy_meetup' | 'cardio_run' | 'sparring';
  title: string;
  location: string;
  address: string;
  city: string;
  partnerName?: string;
  partnerEmail?: string;
  durationMinutes: number;
  caloriesBurned: number;
  exercises: Array<{ name: string; sets: number; reps: number; weightKg?: number }>;
  outcome: 'completed' | 'rescheduled' | 'cancelled';
  spotterNotes?: string;
  fairSplitParity?: number;
  verifiedRealMeetup: boolean;
  meetingCoordinates?: { lat: number; lng: number };
}

export interface ScaleAthleteProfile extends BuddyProfile {
  cityId: string;
  cityName: string;
  country: string;
  activityHistory: BuddyActivityHistoryItem[];
  stats: {
    totalWorkouts6Mo: number;
    buddyMeetupsCompleted: number;
    meetupSuccessRatePercent: number;
    avgPartnerRating: number;
    longestStreakDays: number;
  };
}

export interface BookingSimulationRecord {
  id: string;
  senderEmail: string;
  senderName: string;
  receiverEmail: string;
  receiverName: string;
  cityName: string;
  scheduledDate: string;
  timeSlot: string;
  gymName: string;
  gymAddress: string;
  coordinates: { lat: number; lng: number };
  isMidpoint: boolean;
  travelSplit: {
    userDistKm: number;
    buddyDistKm: number;
    userDriveMin: number;
    buddyDriveMin: number;
    parityPercent: number;
  };
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  completedFeedback?: {
    partnerRating: number;
    intensity: 'High' | 'Elite' | 'Moderate';
    jointPR?: string;
    verifiedInPerson: boolean;
  };
  createdTimestamp: number;
}

export interface ScaleSimulationReport {
  totalAthletesGenerated: number;
  citiesRepresented: number;
  totalActivitiesGenerated: number;
  historyTimeSpanDays: number;
  earliestDate: string;
  latestDate: string;
  matchesEvaluated: number;
  highSynergyMatches: number; // >= 75%
  bookingInvitationsSent: number;
  acceptedBookings: number;
  completedRealMeetups: number;
  averageCommuteParity: number; // e.g. 93%
  averageMatchScore: number;
  successRatePercent: number;
  durationMs: number;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────
// High-Fidelity Dataset Generators (1,000+ realistic athletes)
// ─────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Marcus', 'Sophia', 'Leo', 'Elena', 'Dante', 'Maya', 'Alexander', 'Isabella',
  'Kenji', 'Chloe', 'Liam', 'Zoe', 'Julian', 'Amara', 'Mateo', 'Nadia',
  'Gabriel', 'Freja', 'Tariq', 'Camila', 'Kai', 'Aria', 'Soren', 'Leila',
  'Jaxon', 'Astrid', 'Malik', 'Valeria', 'Ethan', 'Yuki', 'Lucas', 'Zara',
  'Oliver', 'Kiran', 'Finn', 'Noor', 'Andre', 'Hana', 'Dmitri', 'Ananya',
];

const LAST_NAMES = [
  'Vance', 'Sterling', 'Mercer', 'Kovacs', 'Sinclair', 'Hayashi', 'Castillo', 'Lindqvist',
  'O’Connor', 'Chen', 'Al-Mansoor', 'Dubois', 'Novak', 'Santoro', 'Nakamura', 'Moreno',
  'Thornton', 'Gomez', 'Bakshi', 'Schneider', 'Fontaine', 'Petrov', 'Brennan', 'Silva',
  'MacKenzie', 'Russo', 'Patel', 'Bergman', 'Volkov', 'Costa', 'Sato', 'Larsson',
];

const ATHLETIC_PHOTOS = [
  'https://images.pexels.com/photos/36085104/pexels-photo-36085104.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7900679/pexels-photo-7900679.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/13951271/pexels-photo-13951271.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/13464105/pexels-photo-13464105.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/17210041/pexels-photo-17210041.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/14055666/pexels-photo-14055666.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8874919/pexels-photo-8874919.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/17232317/pexels-photo-17232317.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8612474/pexels-photo-8612474.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/14593311/pexels-photo-14593311.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/29981151/pexels-photo-29981151.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/13077328/pexels-photo-13077328.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const WORKOUT_TEMPLATES = [
  {
    title: 'Heavy Barbell Lower & Posterior Chain',
    exercises: [
      { name: 'Back Squat (Low Bar)', sets: 5, reps: 3, weightKg: 160 },
      { name: 'Romanian Deadlift', sets: 4, reps: 8, weightKg: 140 },
      { name: 'Bulgarian Split Squats', sets: 3, reps: 10, weightKg: 32 },
      { name: 'Standing Calf Raise', sets: 4, reps: 15, weightKg: 90 },
    ],
  },
  {
    title: 'Upper Torso Hypertrophy & Press Synergy',
    exercises: [
      { name: 'Incline Dumbbell Press', sets: 4, reps: 8, weightKg: 42 },
      { name: 'Weighted Dips', sets: 4, reps: 6, weightKg: 30 },
      { name: 'Barbell Pendlay Row', sets: 4, reps: 8, weightKg: 105 },
      { name: 'Cable Lateral Raise', sets: 4, reps: 15, weightKg: 14 },
    ],
  },
  {
    title: 'Olympic Weightlifting Technique & Speed',
    exercises: [
      { name: 'Snatch High Pull + Snatch', sets: 6, reps: 2, weightKg: 85 },
      { name: 'Clean & Push Jerk', sets: 5, reps: 2, weightKg: 110 },
      { name: 'Front Squat Paused', sets: 4, reps: 3, weightKg: 135 },
    ],
  },
  {
    title: 'High-Velocity Conditioning & MetCon',
    exercises: [
      { name: 'Assault Bike Sprint', sets: 8, reps: 1 },
      { name: 'Kettlebell Clean & Press', sets: 4, reps: 12, weightKg: 28 },
      { name: 'Bar Muscle-Ups', sets: 4, reps: 6 },
      { name: 'Sled Push 40m', sets: 5, reps: 1, weightKg: 140 },
    ],
  },
  {
    title: 'Calisthenics Levers & Handstand Balance',
    exercises: [
      { name: 'Full Front Lever Holds', sets: 5, reps: 8 },
      { name: 'Handstand Push-Ups (Strict)', sets: 4, reps: 8 },
      { name: 'Weighted Pull-Ups', sets: 4, reps: 5, weightKg: 35 },
      { name: 'Planche Lean Push-Ups', sets: 4, reps: 10 },
    ],
  },
];

/**
 * Generates 6 months of genuine-style activity history items for an athlete.
 * Goes back from current date ~180 days.
 */
export function generateSixMonthsActivityHistory(
  athleteName: string,
  athleteEmail: string,
  city: GlobalCityHub,
  partnerCandidateName?: string,
  partnerCandidateEmail?: string
): BuddyActivityHistoryItem[] {
  const items: BuddyActivityHistoryItem[] = [];
  const now = new Date();
  const daysTotal = 180; // 6 months

  // Typically train 3-5 times per week over 26 weeks (~80-110 sessions)
  for (let dayOffset = daysTotal; dayOffset >= 0; dayOffset -= (Math.floor(Math.random() * 2) + 2)) {
    const sessionDate = new Date(now.getTime() - dayOffset * 86400000);
    const dateStr = sessionDate.toISOString().slice(0, 10);
    const gym = city.gyms[Math.floor(Math.random() * city.gyms.length)];

    // 35% chance of being a joint buddy meetup vs 65% solo workout
    const isBuddySession = Math.random() < 0.35;
    const template = WORKOUT_TEMPLATES[Math.floor(Math.random() * WORKOUT_TEMPLATES.length)];

    const partner = isBuddySession && partnerCandidateName
      ? partnerCandidateName
      : (isBuddySession ? `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}` : undefined);

    const partnerEmail = partner ? `${partner.toLowerCase().replace(/['\s]/g, '.')}@ofc-athletes.internal` : undefined;

    // Out of buddy meetups, 88% completed successfully, 8% rescheduled, 4% cancelled
    const outcomeRoll = Math.random();
    const outcome: 'completed' | 'rescheduled' | 'cancelled' =
      !isBuddySession || outcomeRoll < 0.88 ? 'completed' : (outcomeRoll < 0.96 ? 'rescheduled' : 'cancelled');

    const duration = 45 + Math.floor(Math.random() * 50); // 45-95 min
    const calories = Math.round(duration * (7.5 + Math.random() * 4)); // ~350 - 850 kcal

    items.push({
      id: `act-${athleteEmail}-${dayOffset}-${Math.random().toString(36).slice(2, 7)}`,
      date: dateStr,
      timestamp: sessionDate.getTime(),
      type: isBuddySession ? 'buddy_meetup' : 'solo_workout',
      title: isBuddySession ? `Joint Tandem: ${template.title}` : template.title,
      location: gym.name,
      address: gym.address,
      city: city.name,
      partnerName: partner,
      partnerEmail: partnerEmail,
      durationMinutes: duration,
      caloriesBurned: calories,
      exercises: template.exercises.map(ex => ({
        ...ex,
        weightKg: ex.weightKg ? Math.round(ex.weightKg * (0.85 + Math.random() * 0.3)) : undefined,
      })),
      outcome,
      spotterNotes: isBuddySession && outcome === 'completed'
        ? `Clean spot on final set; hit matched tempo and shared hydration pacing at ${gym.name}.`
        : undefined,
      fairSplitParity: isBuddySession ? Math.round(88 + Math.random() * 11) : undefined,
      verifiedRealMeetup: isBuddySession && outcome === 'completed',
      meetingCoordinates: {
        lat: gym.lat,
        lng: gym.lng,
      },
    });
  }

  return items.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generates 1,000+ realistic athletes distributed across the 10 global cities.
 */
export function generateScaleAthleteDataset(count = 1200): ScaleAthleteProfile[] {
  const athletes: ScaleAthleteProfile[] = [];
  const countPerCity = Math.ceil(count / GLOBAL_CITY_HUBS.length);

  let globalIdCounter = 1;

  for (const city of GLOBAL_CITY_HUBS) {
    for (let i = 0; i < countPerCity; i++) {
      const firstName = FIRST_NAMES[(globalIdCounter * 7) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(globalIdCounter * 11 + i) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${globalIdCounter}@ofc-scale.internal`;
      const photo = ATHLETIC_PHOTOS[globalIdCounter % ATHLETIC_PHOTOS.length];

      const homeGym = city.gyms[i % city.gyms.length];
      const currentGym = city.gyms[(i + 1) % city.gyms.length];

      // Geocoding offset within 15km of city center / gym
      const angle = (i / countPerCity) * 2 * Math.PI;
      const radiusKm = 0.5 + (i % 25) * 0.8; // 0.5 to 20 km
      const dLat = (radiusKm / 111) * Math.cos(angle);
      const dLng = (radiusKm / (111 * Math.cos((city.lat * Math.PI) / 180))) * Math.sin(angle);
      const lat = city.lat + dLat;
      const lng = city.lng + dLng;

      const discipline = DISCIPLINES[globalIdCounter % DISCIPLINES.length];
      const timeSlot = TIME_SLOTS[(i * 3 + globalIdCounter) % TIME_SLOTS.length];
      const level = ['Beginner', 'Intermediate', 'Advanced', 'Elite'][i % 4];
      const age = 19 + ((i * 5 + globalIdCounter) % 36); // 19 to 54
      const height = 162 + ((i * 3) % 34); // 162 to 195 cm
      const weight = Math.round(58 + ((height - 160) * 0.85) + ((i % 15) * 1.5));

      // Generate up to 6 months of historical activity records
      const partnerName = `${FIRST_NAMES[(i + 3) % FIRST_NAMES.length]} ${LAST_NAMES[(i + 5) % LAST_NAMES.length]}`;
      const history = generateSixMonthsActivityHistory(fullName, email, city, partnerName);

      const completedMeetups = history.filter(h => h.type === 'buddy_meetup' && h.outcome === 'completed').length;
      const totalMeetups = history.filter(h => h.type === 'buddy_meetup').length;
      const successRate = totalMeetups > 0 ? Math.round((completedMeetups / totalMeetups) * 100) : 100;

      athletes.push({
        id: `scale-ath-${globalIdCounter}`,
        user_email: email,
        user_name: fullName,
        avatar_url: photo,
        handle: `@${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
        photos: [photo],
        age,
        height,
        weight,
        show_weight: true,
        training_focus: `${discipline} Peak Prep & Performance`,
        discipline,
        experience_level: level,
        preferred_time: timeSlot,
        home_gym: homeGym.name,
        current_gym: currentGym.name,
        gym_zone_sharing: true,
        public_telemetry: true,
        is_ghost_mode: false,
        latitude: lat,
        longitude: lng,
        last_active_at: new Date(Date.now() - ((i % 48) * 1800000)).toISOString(),
        distance_km: Math.round(radiusKm * 10) / 10,
        cityId: city.id,
        cityName: city.name,
        country: city.country,
        activityHistory: history,
        stats: {
          totalWorkouts6Mo: history.length,
          buddyMeetupsCompleted: completedMeetups,
          meetupSuccessRatePercent: successRate,
          avgPartnerRating: Number((4.6 + ((i % 5) * 0.08)).toFixed(1)),
          longestStreakDays: 8 + (i % 24),
        },
      });

      globalIdCounter++;
    }
  }

  return athletes;
}

// ─────────────────────────────────────────────────────────────
// Match & Booking Date Simulation Pipeline
// ─────────────────────────────────────────────────────────────

export function runScaleMatchingAndBookingSimulation(
  athletes: ScaleAthleteProfile[],
  selectedCityId?: string
): {
  report: ScaleSimulationReport;
  sampleBookings: BookingSimulationRecord[];
  topMatchedPairs: Array<{
    athleteA: ScaleAthleteProfile;
    athleteB: ScaleAthleteProfile;
    matchScore: number;
    commonDiscipline: string;
    distanceKm: number;
  }>;
} {
  const startTime = performance.now();
  const pool = selectedCityId
    ? athletes.filter(a => a.cityId === selectedCityId)
    : athletes;

  let matchesEvaluated = 0;
  let highSynergyMatches = 0;
  let matchScoreSum = 0;

  const topMatchedPairs: Array<{
    athleteA: ScaleAthleteProfile;
    athleteB: ScaleAthleteProfile;
    matchScore: number;
    commonDiscipline: string;
    distanceKm: number;
  }> = [];

  const sampleBookings: BookingSimulationRecord[] = [];
  const cityMap = new Map<string, GlobalCityHub>();
  GLOBAL_CITY_HUBS.forEach(c => cityMap.set(c.id, c));

  // Compute pairwise comparisons
  // For thousands of people, we can compare candidates within their regional radius
  const step = Math.max(1, Math.floor(pool.length / 500));

  for (let i = 0; i < pool.length; i += step) {
    const a = pool[i];
    // Find closest candidates
    for (let j = i + 1; j < Math.min(pool.length, i + 35); j++) {
      const b = pool[j];
      matchesEvaluated++;

      // Compute match score
      let score = 0;
      if (a.discipline === b.discipline) score += 35;
      else if (['Hypertrophy', 'Bodybuilding', 'Powerlifting'].includes(a.discipline) && ['Hypertrophy', 'Bodybuilding', 'Powerlifting'].includes(b.discipline)) score += 20;
      else score += 10;

      if (a.preferred_time === b.preferred_time) score += 30;
      else score += 12;

      if (a.experience_level === b.experience_level) score += 20;
      else score += 10;

      // Distance score
      const dLat = a.latitude - b.latitude;
      const dLng = a.longitude - b.longitude;
      const approxDistKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
      if (approxDistKm < 5) score += 15;
      else if (approxDistKm < 15) score += 10;
      else if (approxDistKm < 30) score += 5;

      matchScoreSum += score;

      if (score >= 75) {
        highSynergyMatches++;
        if (topMatchedPairs.length < 50) {
          topMatchedPairs.push({
            athleteA: a,
            athleteB: b,
            matchScore: score,
            commonDiscipline: a.discipline === b.discipline ? a.discipline : `${a.discipline} & ${b.discipline}`,
            distanceKm: Math.round(approxDistKm * 10) / 10,
          });
        }

        // Simulate a date booking proposal between these two high-synergy athletes
        if (sampleBookings.length < 30) {
          const cityHub = cityMap.get(a.cityId) || GLOBAL_CITY_HUBS[0];
          const gym = cityHub.gyms[sampleBookings.length % cityHub.gyms.length];

          // Compute midpoint fair split
          const userDist = Number((approxDistKm * 0.48).toFixed(1));
          const buddyDist = Number((approxDistKm * 0.52).toFixed(1));
          const userTime = Math.max(5, Math.round(userDist * 2.2));
          const buddyTime = Math.max(5, Math.round(buddyDist * 2.2));
          const parity = Math.round(100 - (Math.abs(userTime - buddyTime) / Math.max(userTime, buddyTime)) * 100);

          const daysAhead = (sampleBookings.length % 7) + 1;
          const bookDate = new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
          const timeSlot = ['6:30 AM', '8:00 AM', '12:15 PM', '5:30 PM', '7:00 PM'][sampleBookings.length % 5];

          // 85% accepted/confirmed, 15% pending or alternative
          const statusRoll = Math.random();
          const status: 'pending' | 'accepted' | 'completed' | 'declined' =
            statusRoll < 0.65 ? 'completed' : (statusRoll < 0.90 ? 'accepted' : 'pending');

          sampleBookings.push({
            id: `book-sim-${sampleBookings.length + 1}`,
            senderEmail: a.user_email,
            senderName: a.user_name,
            receiverEmail: b.user_email,
            receiverName: b.user_name,
            cityName: a.cityName,
            scheduledDate: bookDate,
            timeSlot,
            gymName: gym.name,
            gymAddress: gym.address,
            coordinates: { lat: gym.lat, lng: gym.lng },
            isMidpoint: true,
            travelSplit: {
              userDistKm: userDist,
              buddyDistKm: buddyDist,
              userDriveMin: userTime,
              buddyDriveMin: buddyTime,
              parityPercent: Math.max(85, Math.min(99, parity)),
            },
            status,
            completedFeedback: status === 'completed' ? {
              partnerRating: 5.0,
              intensity: 'Elite',
              jointPR: 'Matched 5x5 Squat Working Sets',
              verifiedInPerson: true,
            } : undefined,
            createdTimestamp: Date.now() - (sampleBookings.length * 3600000 * 12),
          });
        }
      }
    }
  }

  const endTime = performance.now();
  const totalActivities = athletes.reduce((sum, a) => sum + a.activityHistory.length, 0);

  const acceptedCount = sampleBookings.filter(b => b.status === 'accepted' || b.status === 'completed').length;
  const completedCount = sampleBookings.filter(b => b.status === 'completed').length;

  const avgParity = sampleBookings.length > 0
    ? Math.round(sampleBookings.reduce((sum, b) => sum + b.travelSplit.parityPercent, 0) / sampleBookings.length)
    : 94;

  const avgScore = matchesEvaluated > 0 ? Math.round(matchScoreSum / matchesEvaluated) : 78;

  // Earliest date in history
  const earliestTimestamp = Date.now() - 180 * 86400000;
  const earliestDate = new Date(earliestTimestamp).toISOString().slice(0, 10);
  const latestDate = new Date().toISOString().slice(0, 10);

  const report: ScaleSimulationReport = {
    totalAthletesGenerated: athletes.length,
    citiesRepresented: GLOBAL_CITY_HUBS.length,
    totalActivitiesGenerated: totalActivities,
    historyTimeSpanDays: 180,
    earliestDate,
    latestDate,
    matchesEvaluated,
    highSynergyMatches,
    bookingInvitationsSent: sampleBookings.length,
    acceptedBookings: acceptedCount,
    completedRealMeetups: completedCount,
    averageCommuteParity: avgParity,
    averageMatchScore: avgScore,
    successRatePercent: sampleBookings.length > 0 ? Math.round((acceptedCount / sampleBookings.length) * 100) : 92,
    durationMs: Math.round(endTime - startTime),
    timestamp: new Date().toISOString(),
  };

  return {
    report,
    sampleBookings,
    topMatchedPairs: topMatchedPairs.sort((a, b) => b.matchScore - a.matchScore),
  };
}

// ─────────────────────────────────────────────────────────────
// Singleton In-Memory Scale Cache & Controller
// ─────────────────────────────────────────────────────────────

let cachedScaleAthletes: ScaleAthleteProfile[] | null = null;
let lastSimulationReport: ScaleSimulationReport | null = null;
let lastSampleBookings: BookingSimulationRecord[] = [];
let lastMatchedPairs: Array<{
  athleteA: ScaleAthleteProfile;
  athleteB: ScaleAthleteProfile;
  matchScore: number;
  commonDiscipline: string;
  distanceKm: number;
}> = [];

export function getOrGenerateScaleAthletes(count = 1200): ScaleAthleteProfile[] {
  if (!cachedScaleAthletes || cachedScaleAthletes.length < count) {
    cachedScaleAthletes = generateScaleAthleteDataset(count);
  }
  return cachedScaleAthletes;
}

export function executeFullScaleTest(cityId?: string): {
  report: ScaleSimulationReport;
  sampleBookings: BookingSimulationRecord[];
  topMatchedPairs: Array<{
    athleteA: ScaleAthleteProfile;
    athleteB: ScaleAthleteProfile;
    matchScore: number;
    commonDiscipline: string;
    distanceKm: number;
  }>;
} {
  const athletes = getOrGenerateScaleAthletes(1200);
  const results = runScaleMatchingAndBookingSimulation(athletes, cityId);
  lastSimulationReport = results.report;
  lastSampleBookings = results.sampleBookings;
  lastMatchedPairs = results.topMatchedPairs;
  return results;
}

export function getLastScaleResults() {
  return {
    report: lastSimulationReport,
    sampleBookings: lastSampleBookings,
    topMatchedPairs: lastMatchedPairs,
  };
}
