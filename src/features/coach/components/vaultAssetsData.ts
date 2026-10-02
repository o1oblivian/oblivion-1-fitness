// ============================================================================
// COACH VAULT REEL ASSETS & BIOMECHANIC AUDITS
// ============================================================================

export interface VaultFilmstripClip {
  id: string;
  title: string;
  duration: string;
  tag: string;
  badge: string;
  thumbnail: string;
  videoUrl: string;
}

export interface VaultCoach {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  specialtyTitle: string;
}

export interface VaultAsset {
  id: string;
  title: string;
  category: 'MOBILITY' | 'BIOMECHANICS' | 'STRENGTH' | 'HYPERTROPHY' | 'HYBRID' | 'TECHNIQUE' | 'FORM_CHECK' | 'KINEMATICS' | string;
  filterTag?: 'ALL' | 'MOBILITY & REHAB' | 'CHEST & TRICEPS' | 'QUADS & GLUTES' | 'HYROX / CONDITIONING' | string;
  fileType?: string;
  duration: string;
  views?: string;
  cues?: string;
  thumbnailUrl?: string;
  thumbnail: string;
  videoUrl?: string;
  coach?: VaultCoach;
  filmstripClips?: VaultFilmstripClip[];
  athleteName: string;
  athleteHandle: string;
  resolution?: string;
  status: 'VERIFIED' | 'NEEDS_AUDIT' | 'ELITE' | 'MASTERCLASS';
  score?: number;
  angles?: { label: string; value: string }[];
  coachNotes?: string;
  timestamp: string;
}

export const VAULT_VIDEO_ASSETS: VaultAsset[] = [
  {
    id: 'vault-reel-1',
    title: '90/90 Hip Flow & Deep Capsule Release',
    category: 'MOBILITY',
    filterTag: 'MOBILITY & REHAB',
    fileType: 'video/mp4',
    duration: '0:48',
    views: '42.8K',
    cues: 'Do not round the lumbar spine during transitions. Anchor heels firmly, pivot across hips, and exhale for 4s into the front shin hinge.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-hip-thrust-exercise-with-a-barbell-44139-large.mp4',
    athleteName: 'Elena Vasquez',
    athleteHandle: '@elena.mobility',
    status: 'MASTERCLASS',
    score: 99,
    timestamp: 'Today, 09:15',
    resolution: '4K 60FPS',
    coach: {
      id: 'coach-elena',
      name: 'Elena Vasquez',
      handle: '@elena.mobility',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      specialtyTitle: 'Mobility Coach Elena Vasquez',
    },
    filmstripClips: [
      {
        id: 'clip-1a',
        title: 'Shin Box Internal Shift',
        duration: '0:14',
        tag: 'DRILL 1',
        badge: 'CAPSULE',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-hip-thrust-exercise-with-a-barbell-44139-large.mp4',
      },
      {
        id: 'clip-1b',
        title: 'Pigeon Dynamic Pulses',
        duration: '0:18',
        tag: 'DRILL 2',
        badge: 'ADDUCTOR',
        thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-hip-thrust-exercise-with-a-barbell-44139-large.mp4',
      },
      {
        id: 'clip-1c',
        title: 'Pelvic Floor Integration',
        duration: '0:16',
        tag: 'PRO TIP',
        badge: 'VAGAL',
        thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-hip-thrust-exercise-with-a-barbell-44139-large.mp4',
      },
    ],
  },
  {
    id: 'vault-reel-2',
    title: 'Incline Pressing Angle Matrix',
    category: 'BIOMECHANICS',
    filterTag: 'CHEST & TRICEPS',
    fileType: 'video/mp4',
    duration: '0:54',
    views: '88.3K',
    cues: 'Set incline strictly to 30 degrees. Retract and pack scapulae into back pockets, tuck elbows at 45 degrees, and drive through the palm heels.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-heavy-ropes-in-a-gym-44155-large.mp4',
    athleteName: 'Alexander Hayes',
    athleteHandle: '@alexhayes_lift',
    status: 'MASTERCLASS',
    score: 97,
    timestamp: 'Yesterday',
    resolution: '4K 60FPS',
    coach: {
      id: 'coach-staff',
      name: 'Staff Coach',
      handle: '@staff.hypertrophy',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      specialtyTitle: 'Hypertrophy Specialist',
    },
    filmstripClips: [
      {
        id: 'clip-2a',
        title: 'Bench Angle Setup (30°)',
        duration: '0:16',
        tag: 'DRILL 1',
        badge: 'SETUP',
        thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-heavy-ropes-in-a-gym-44155-large.mp4',
      },
      {
        id: 'clip-2b',
        title: 'Scapular Depression Lock',
        duration: '0:20',
        tag: 'DRILL 2',
        badge: 'TENSION',
        thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-heavy-ropes-in-a-gym-44155-large.mp4',
      },
      {
        id: 'clip-2c',
        title: 'Eccentric 3s Bar Path Control',
        duration: '0:18',
        tag: 'PRO TIP',
        badge: 'TEMPO',
        thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-heavy-ropes-in-a-gym-44155-large.mp4',
      },
    ],
  },
  {
    id: 'vault-reel-3',
    title: 'Low-Bar Squat Torso Angle & Lumbar Shearing',
    category: 'STRENGTH',
    filterTag: 'QUADS & GLUTES',
    fileType: 'video/mp4',
    duration: '1:12',
    views: '114.9K',
    cues: 'Pin bar across rear delts. Brace 360 degrees, spread the floor with your feet, and push hips straight back before initiating knee break.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-doing-pull-ups-43841-large.mp4',
    athleteName: 'Dr. Jason Reed',
    athleteHandle: '@dr.reed.sbd',
    status: 'MASTERCLASS',
    score: 98,
    timestamp: '2 days ago',
    resolution: '4K 60FPS',
    coach: {
      id: 'coach-jason',
      name: 'Dr. Jason Reed',
      handle: '@dr.reed.sbd',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      specialtyTitle: 'Biomechanics Director Dr. Jason Reed',
    },
    filmstripClips: [
      {
        id: 'clip-3a',
        title: 'Rear Delt Shelf Placement',
        duration: '0:22',
        tag: 'DRILL 1',
        badge: 'BAR PATH',
        thumbnail: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-doing-pull-ups-43841-large.mp4',
      },
      {
        id: 'clip-3b',
        title: 'Floor Wedge Foot Mechanics',
        duration: '0:26',
        tag: 'DRILL 2',
        badge: 'GLUTE MAX',
        thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-doing-pull-ups-43841-large.mp4',
      },
      {
        id: 'clip-3c',
        title: 'Torso Angle vs Moment Arm',
        duration: '0:24',
        tag: 'PRO TIP',
        badge: 'SHEARING',
        thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-doing-pull-ups-43841-large.mp4',
      },
    ],
  },
  {
    id: 'vault-reel-4',
    title: 'Compromised Running & Lactate Clearance Drills',
    category: 'HYBRID',
    filterTag: 'HYROX / CONDITIONING',
    fileType: 'video/mp4',
    duration: '0:58',
    views: '67.1K',
    cues: 'After high-load sled push or wall balls, relax arms and lower shoulders. Transition into high cadence, short stride turnover for the first 300m.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-running-on-a-treadmill-in-a-gym-44146-large.mp4',
    athleteName: 'Anya Petrova',
    athleteHandle: '@anya.hyrox',
    status: 'MASTERCLASS',
    score: 96,
    timestamp: '3 days ago',
    resolution: '4K 60FPS',
    coach: {
      id: 'coach-anya',
      name: 'Anya Petrova',
      handle: '@anya.hyrox',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      specialtyTitle: 'Hyrox Master Coach Anya Petrova',
    },
    filmstripClips: [
      {
        id: 'clip-4a',
        title: 'Sled-to-Run Leg Flush',
        duration: '0:18',
        tag: 'DRILL 1',
        badge: 'LACTATE',
        thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-running-on-a-treadmill-in-a-gym-44146-large.mp4',
      },
      {
        id: 'clip-4b',
        title: 'SkiErg Stroke Efficiency',
        duration: '0:22',
        tag: 'DRILL 2',
        badge: 'ENGINE',
        thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-running-on-a-treadmill-in-a-gym-44146-large.mp4',
      },
      {
        id: 'clip-4c',
        title: 'Wall Ball Kinetic Rebound',
        duration: '0:18',
        tag: 'PRO TIP',
        badge: 'TURNOVER',
        thumbnail: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=400&q=80',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-running-on-a-treadmill-in-a-gym-44146-large.mp4',
      },
    ],
  },
];

export const VAULT_AUDIT_ASSETS: VaultAsset[] = [
  {
    id: 'vault-01',
    title: 'Barbell Back Squat - Valgus Collapse & Depth Audit',
    category: 'FORM_CHECK',
    filterTag: 'QUADS & GLUTES',
    athleteName: 'Elena Rostova',
    athleteHandle: '@rostova_kinetics',
    duration: '0:42',
    resolution: '4K 60FPS',
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    status: 'NEEDS_AUDIT',
    score: 84,
    angles: [{ label: 'Knee Flexion', value: '118°' }, { label: 'Torso Angle', value: '38°' }],
    coachNotes: 'Knee tracking inward at turnaround. Cue hip external rotation.',
    timestamp: 'Today, 08:24',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-hip-thrust-exercise-with-a-barbell-44139-large.mp4',
  },
  {
    id: 'vault-02',
    title: 'Conventional Deadlift - Posterior Wedge Mechanics',
    category: 'TECHNIQUE',
    filterTag: 'QUADS & GLUTES',
    athleteName: 'Devon Thorne',
    athleteHandle: '@thorne_heavy',
    duration: '0:35',
    resolution: '1080P 60FPS',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    status: 'ELITE',
    score: 98,
    angles: [{ label: 'Hip Hinge', value: '74°' }, { label: 'Bar Path', value: '99.4% Linear' }],
    coachNotes: 'Flawless slack-pull and lats pre-engagement.',
    timestamp: 'Yesterday',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-doing-pull-ups-43841-large.mp4',
  },
  {
    id: 'vault-03',
    title: 'Bench Press - Scapular Retraction & Arch Stability',
    category: 'FORM_CHECK',
    filterTag: 'CHEST & TRICEPS',
    athleteName: 'Jordan Miller',
    athleteHandle: '@jmiller_power',
    duration: '0:28',
    resolution: '4K 60FPS',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    status: 'VERIFIED',
    score: 92,
    angles: [{ label: 'Elbow Flare', value: '45°' }],
    coachNotes: 'Touchpoint solid at lower sternum.',
    timestamp: '2 days ago',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-heavy-ropes-in-a-gym-44155-large.mp4',
  },
];

export const VAULT_ASSETS: VaultAsset[] = [...VAULT_VIDEO_ASSETS, ...VAULT_AUDIT_ASSETS];
