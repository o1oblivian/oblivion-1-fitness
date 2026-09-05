export interface CuratedWallpaper {
  id: string;
  title: string;
  category: 'hyrox' | 'olympia' | 'gym' | 'athlete' | 'fitness' | 'nature' | 'outdoor';
  categoryLabel: string;
  photoId: string;
  author: string;
  ringColors: {
    outer: string;
    middle: string;
    inner: string;
  };
}

export const WALLPAPER_CATEGORIES = [
  { id: 'all', label: 'All Wallpapers' },
  { id: 'hyrox', label: 'Hyrox & Racing' },
  { id: 'olympia', label: 'Mr. Olympia & Stage' },
  { id: 'gym', label: 'Gym Floor & Iron' },
  { id: 'athlete', label: 'Gym Athletes' },
  { id: 'fitness', label: 'Functional Fitness' },
  { id: 'nature', label: 'Nature & Alpine' },
  { id: 'outdoor', label: 'Outdoor Activities' },
] as const;

export type WallpaperCategory = (typeof WALLPAPER_CATEGORIES)[number]['id'];

// Curated 200 Athletic, Hyrox, Mr. Olympia, Gym, Nature, Outdoor & Fitness Wallpapers (All Mixed Up & Verified)
export const CURATED_100_WALLPAPERS: CuratedWallpaper[] = [
  {
    "id": "wp-001",
    "title": "Mr. Olympia Classic Physique Stage",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-1552249",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-002",
    "title": "Hyrox Sled Push Turf Battle",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-1756959",
    "author": "Leon Ardho",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-003",
    "title": "Dumbbell Rack in Obsidian Light",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1534438327276-14e5300c3a48",
    "author": "Sven Mieke",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-004",
    "title": "Athletic Pull-Up Lockout",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1534367507873-d2d7e24c797f",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-005",
    "title": "Yosemite Dawn Reflection",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1426604966848-d7adac402bff",
    "author": "Bailey Zindel",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-006",
    "title": "Alpine Mountain Skyrunning Stride",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1502680390469-be75c86b636f",
    "author": "Tim Foster",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-007",
    "title": "Functional Conditioning Arena",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1552674605-db6ffd4facb5",
    "author": "Humphrey Muleba",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-008",
    "title": "Stage Back Double Bicep Striations",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-949126",
    "author": "Arthur Brognoli",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-009",
    "title": "Hyrox 1000m Compromised Run",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-3490348",
    "author": "Pavel Danilyuk",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-010",
    "title": "Heavy Chalk Grip Deadlift",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1526506118085-60ce8714f8c5",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-011",
    "title": "Chalk Cloud Barbell Cleans",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1517836357463-d25dfeac3438",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-012",
    "title": "Misty Alpine Lake Pine Ridge",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1470071459604-3b5ec3a7fe05",
    "author": "Kalina S.",
    "ringColors": {
      "outer": "#047857",
      "middle": "#065F46",
      "inner": "#6EE7B7"
    }
  },
  {
    "id": "wp-013",
    "title": "Road Cycling Switchback Ascent",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1544441893-675973e31985",
    "author": "Munich Run",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-014",
    "title": "Mobility & Core Stability Focus",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1544367567-0f2fcb009e0b",
    "author": "Carl Barcelo",
    "ringColors": {
      "outer": "#10B981",
      "middle": "#059669",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-015",
    "title": "Symmetry & Muscular Conditioning",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-949132",
    "author": "Arthur Brognoli",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#92400E",
      "inner": "#FEF3C7"
    }
  },
  {
    "id": "wp-016",
    "title": "Hyrox Wall Ball Target Station",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-6456144",
    "author": "Allan Mas",
    "ringColors": {
      "outer": "#10B981",
      "middle": "#059669",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-017",
    "title": "Atmospheric Iron Sanctuary",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1540497077202-7c8a3999166f",
    "author": "Humphrey Muleba",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#D1D5DB"
    }
  },
  {
    "id": "wp-018",
    "title": "Chalk Explosion Heavy Deadlift",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-1552252",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-019",
    "title": "Swiss Glacier Mountain Range",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1464822759023-fed622ff2c3b",
    "author": "Kalina S.",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#93C5FD"
    }
  },
  {
    "id": "wp-020",
    "title": "Misty Pine Singletrack Trail Run",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1486218119243-13883505764c",
    "author": "Jenny Hill",
    "ringColors": {
      "outer": "#047857",
      "middle": "#065F46",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-021",
    "title": "Dynamic Pre-Workout Warmup",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1506126613408-eca07ce68773",
    "author": "Geert Pieters",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-022",
    "title": "Gold Trophy Rear Lat Spread",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-2204196",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-023",
    "title": "Hyrox Burpee Broad Jump Grind",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-6456141",
    "author": "Allan Mas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-024",
    "title": "Heavy Metal Barbell Knurling",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1581009146145-b5ef050c2e1e",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-025",
    "title": "Olympic Back Squat Drive",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-2261477",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-026",
    "title": "Dolomites Jagged Crest at Sunset",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1506744038136-46273834b3fb",
    "author": "Bailey Zindel",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-027",
    "title": "Red Running Track Starting Blocks",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1530549387789-4c1017266635",
    "author": "Fitsum Admasu",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-028",
    "title": "Agility Ladder Footwork Drill",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1434682881908-b43d0467b798",
    "author": "Fitsum Admasu",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-029",
    "title": "Olympia Spotlight Front Chest Pose",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-4761787",
    "author": "Tima Miroshnichenko",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-030",
    "title": "Dual Heavy Battle Rope Slam",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-1552106",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#3B82F6",
      "middle": "#2563EB",
      "inner": "#93C5FD"
    }
  },
  {
    "id": "wp-031",
    "title": "Competition Bumper Plate Vault",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1584735935682-2f2b69dff9d2",
    "author": "John Arano",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-032",
    "title": "Female Powerlifter Deadlift Lockout",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-2294361",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-033",
    "title": "Pacific Northwest Evergreen Mist",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1448375240586-882707db888b",
    "author": "Sebastian Unrau",
    "ringColors": {
      "outer": "#065F46",
      "middle": "#064E3B",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-034",
    "title": "Peloton Paceline Road Cycling",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1485965120184-e220f721d03e",
    "author": "Viktor Kern",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-035",
    "title": "Sprint Acceleration Track Phase",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1517438322307-e67111335449",
    "author": "Fitsum Admasu",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#BFDBFE"
    }
  },
  {
    "id": "wp-036",
    "title": "Bicep Peak & Vascular Definition",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-4761792",
    "author": "Tima Miroshnichenko",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-037",
    "title": "Competition Farmers Carry Distance",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-1552103",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-038",
    "title": "Powerlifting Squat Platform",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1517963879433-6ad2b056d712",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-039",
    "title": "Clean and Jerk Catch Stance",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-1552248",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-040",
    "title": "Mirror Alpine Water & Forest",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1501785888041-af3ef285b470",
    "author": "Luca Bravo",
    "ringColors": {
      "outer": "#0284C7",
      "middle": "#0369A1",
      "inner": "#7DD3FC"
    }
  },
  {
    "id": "wp-041",
    "title": "Mountain Ridge Gravel Cycling",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1507035895480-2b3156c31fc8",
    "author": "Coen van de Broek",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#93C5FD"
    }
  },
  {
    "id": "wp-042",
    "title": "Kettlebell Snatch Repetition Arc",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1541534741688-6078c6bfb5c5",
    "author": "John Arano",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-043",
    "title": "Iron Chiseled Traps & Deltoids",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-6550823",
    "author": "Cesar Galeão",
    "ringColors": {
      "outer": "#374151",
      "middle": "#1F2937",
      "inner": "#9CA3AF"
    }
  },
  {
    "id": "wp-044",
    "title": "Hyrox Plyo Box Jump Transition",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-2827392",
    "author": "Pavel Danilyuk",
    "ringColors": {
      "outer": "#F97316",
      "middle": "#EA580C",
      "inner": "#FED7AA"
    }
  },
  {
    "id": "wp-045",
    "title": "Obsidian Dumbbell Array",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1593079831268-3381b0db4a77",
    "author": "Risky Sabriansyah",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#1F2937",
      "inner": "#E5E7EB"
    }
  },
  {
    "id": "wp-046",
    "title": "Chalk Hands Barbell Setup",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-2261482",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-047",
    "title": "Golden Hour Canyon Ridge",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1469474968028-56623f02e42e",
    "author": "David Marcu",
    "ringColors": {
      "outer": "#EA580C",
      "middle": "#C2410C",
      "inner": "#FED7AA"
    }
  },
  {
    "id": "wp-048",
    "title": "Time Trial Aero Cycling Focus",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1502744688674-c619d1586c9e",
    "author": "Markus Spiske",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-049",
    "title": "Turf Sprint Explosive Drive",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1571019614242-c5c5dee9f50b",
    "author": "Humphrey Muleba",
    "ringColors": {
      "outer": "#10B981",
      "middle": "#059669",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-050",
    "title": "Posing Stage Spotlight Profile",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-7674482",
    "author": "Pavel Danilyuk",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-051",
    "title": "Kettlebell Snatch Repetition",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-3289711",
    "author": "Pavel Danilyuk",
    "ringColors": {
      "outer": "#6366F1",
      "middle": "#4F46E5",
      "inner": "#C7D2FE"
    }
  },
  {
    "id": "wp-052",
    "title": "Iron Weights Under Moody Light",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1590487988256-9ed24133863e",
    "author": "Arthur Edelman",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-053",
    "title": "Athlete Focus Eyes on the Bar",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-2261485",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#374151",
      "middle": "#1F2937",
      "inner": "#9CA3AF"
    }
  },
  {
    "id": "wp-054",
    "title": "Snowcapped Rocky Mountain Vista",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1486870591958-9b9d0d1dda99",
    "author": "Kalen Emsley",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#E5E7EB"
    }
  },
  {
    "id": "wp-055",
    "title": "Alpine Ski Mountaineering Skin",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1551698618-1dfe5d97d256",
    "author": "Jonas Denil",
    "ringColors": {
      "outer": "#0284C7",
      "middle": "#0369A1",
      "inner": "#BAE6FD"
    }
  },
  {
    "id": "wp-056",
    "title": "Battle Ropes Power Slam Wave",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1584466977773-e625c37cdd50",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-057",
    "title": "Heavy Dumbbell Bicep Isolation",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-1431282",
    "author": "Anush Gorak",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-058",
    "title": "Hyrox Arena Intensity Drive",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-3253501",
    "author": "Pavel Danilyuk",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-059",
    "title": "High Performance Training Facility",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1579758629938-03607ccdbaba",
    "author": "Humphrey Muleba",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-060",
    "title": "Dumbbell Overhead Shoulder Press",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-3838937",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-061",
    "title": "Alpine Emerald Basin",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1473448912268-2022ce9509d8",
    "author": "Luca Bravo",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-062",
    "title": "Golden Gate Bridge Marathon Run",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1475778057357-d35f37fa89dd",
    "author": "Mick De Paola",
    "ringColors": {
      "outer": "#EA580C",
      "middle": "#C2410C",
      "inner": "#FFEDD5"
    }
  },
  {
    "id": "wp-063",
    "title": "Dumbbell Walking Lunge Matrix",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1584824486509-112e4181ff6b",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-064",
    "title": "Classic Physique Arm Tensity",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-3768916",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-065",
    "title": "Hyrox Sled Pull Rope Anchor",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4753990",
    "author": "Tima Miroshnichenko",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-066",
    "title": "Dumbbells on Rubber Floor",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1584863265045-f9d10ca7fa61",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-067",
    "title": "Heavy Dumbbell Hammer Curls",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-3838389",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-068",
    "title": "Northern Lights Over Peak",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1517411032315-54ef2cb783bb",
    "author": "Jonatan Pie",
    "ringColors": {
      "outer": "#10B981",
      "middle": "#047857",
      "inner": "#6EE7B7"
    }
  },
  {
    "id": "wp-069",
    "title": "Olympic Stadium Track Curves",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1568605117036-5fe5e7bab0b7",
    "author": "Sergey Shmidt",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-070",
    "title": "Treadmill Interval Stride Tempo",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1538805060514-97d9cc17730c",
    "author": "Chander R",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#BFDBFE"
    }
  },
  {
    "id": "wp-071",
    "title": "Massive Tricep & Lat Flexion",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-3768918",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-072",
    "title": "Gymnastic Bar Pulls & Grip",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4753996",
    "author": "Tima Miroshnichenko",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#991B1B",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-073",
    "title": "Olympic Weight Plates Stacked",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1576678927484-cc907957088c",
    "author": "Edgar Chaparro",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-074",
    "title": "Deadlift Setup & Breath Control",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1548690312-e3b507d8c110",
    "author": "John Arano",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-075",
    "title": "Misty Redwood Forest Cathedral",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1441974231531-c6227db76b6e",
    "author": "Luca Bravo",
    "ringColors": {
      "outer": "#065F46",
      "middle": "#064E3B",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-076",
    "title": "Rainy City Marathon Stride",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1512428559087-560fa5ceab42",
    "author": "Filip Mroz",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#D1D5DB"
    }
  },
  {
    "id": "wp-077",
    "title": "Outdoor Hill Sprint Interval",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "photo-1476480862126-209bfaa8edc8",
    "author": "Fitsum Admasu",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-078",
    "title": "Power & Stage Conditioning Cut",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-6550851",
    "author": "Cesar Galeão",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#D1D5DB"
    }
  },
  {
    "id": "wp-079",
    "title": "Hyrox Indoor Track Lap Split",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-703014",
    "author": "RUN 4 FFWPU",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-080",
    "title": "Black & Red Fitness Equipment",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1507398941214-572c25f4b1dc",
    "author": "Sven Mieke",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-081",
    "title": "Muscular Back Lat Definition",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1567013127542-490d757e51fc",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#D1D5DB"
    }
  },
  {
    "id": "wp-082",
    "title": "High Sierra Glacier Lake",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1507525428034-b723cf961d3e",
    "author": "Sean Oulashin",
    "ringColors": {
      "outer": "#0284C7",
      "middle": "#0369A1",
      "inner": "#BAE6FD"
    }
  },
  {
    "id": "wp-083",
    "title": "Alpine Ridge Hiking Expedition",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "photo-1500530855697-b586d89ba3ee",
    "author": "Felix Rostig",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-084",
    "title": "Suspension Trainer Core Fallout",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "pexels-3839074",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-085",
    "title": "Vein Striations & Quad Drive",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-1547248",
    "author": "Scott Webb",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-086",
    "title": "Agility Hurdle Power Footwork",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-703016",
    "author": "RUN 4 FFWPU",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-087",
    "title": "Obsidian Barbell Loading Bay",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-1552242",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-088",
    "title": "Boxer Heavy Bag Training",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1574680178050-55c6a6a96e0a",
    "author": "Humphrey Muleba",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-089",
    "title": "Starry Sky Above Mountain Summit",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "photo-1419242902214-272b3f66ee7a",
    "author": "Vincentiu Solomon",
    "ringColors": {
      "outer": "#4F46E5",
      "middle": "#4338CA",
      "inner": "#C7D2FE"
    }
  },
  {
    "id": "wp-090",
    "title": "Sprint Spike Acceleration",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-260447",
    "author": "Pixabay",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-091",
    "title": "Medicine Ball Explosive Overhead Slam",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "pexels-3838708",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-092",
    "title": "Olympia Prep Cable Flyes Squeeze",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-13106574",
    "author": "Alfo Medeiros",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-093",
    "title": "Speed Curved Treadmill Split",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-1954524",
    "author": "William Choquette",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#BFDBFE"
    }
  },
  {
    "id": "wp-094",
    "title": "Heavy Incline Dumbbell Bench",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-841130",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-095",
    "title": "Intense Barbell Deadlift Grind",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1599058917212-d750089bc07e",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-096",
    "title": "Mirror Lake Dolomite Pinnacle",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-791763",
    "author": "Chait Goli",
    "ringColors": {
      "outer": "#0284C7",
      "middle": "#0369A1",
      "inner": "#7DD3FC"
    }
  },
  {
    "id": "wp-097",
    "title": "Alpine Mountain Pass Road Cycling",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-247599",
    "author": "Flo Maderebner",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-098",
    "title": "Kettlebell Russian Swing Drive",
    "category": "fitness",
    "categoryLabel": "Functional Fitness",
    "photoId": "pexels-3838709",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-099",
    "title": "Side Chest Posing Stance",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-13106578",
    "author": "Alfo Medeiros",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-100",
    "title": "Compromised 1km Pace Grind",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-1954525",
    "author": "William Choquette",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-101",
    "title": "Steel Bumper Plates on Concrete",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-416778",
    "author": "Scott Webb",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#D1D5DB"
    }
  },
  {
    "id": "wp-102",
    "title": "Dumbbell Row Back Activation",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1550345332-09e3ac987658",
    "author": "Sven Mieke",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-103",
    "title": "Glacial Valley Emerald Waters",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-1054218",
    "author": "Santosh Verma",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-104",
    "title": "Forest Singletrack Trail Run",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-100582",
    "author": "Run FF",
    "ringColors": {
      "outer": "#047857",
      "middle": "#065F46",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-105",
    "title": "Pre-Stage Pump Up Barbells",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-7991663",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-106",
    "title": "Max Heart Rate Sprint Cadence",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-1954526",
    "author": "William Choquette",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FEF3C7"
    }
  },
  {
    "id": "wp-107",
    "title": "Heavy Dumbbell Arsenal",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-136404",
    "author": "Skitterphoto",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-108",
    "title": "Calisthenics Athlete Handstand",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1522163182402-834f871fd851",
    "author": "Alex Valdivia",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#1F2937",
      "inner": "#E5E7EB"
    }
  },
  {
    "id": "wp-109",
    "title": "Dolomites Jagged Crest at Dawn",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-1450082",
    "author": "Eberhard Grossgasteiger",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-110",
    "title": "High Mountain Skyrunning Ridge",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-248547",
    "author": "Mario Calvo",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#93C5FD"
    }
  },
  {
    "id": "wp-111",
    "title": "Back Double Bicep Silhouette",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-8032733",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-112",
    "title": "Burpee Chest to Turf Explosive",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-2247179",
    "author": "Arthur Brognoli",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-113",
    "title": "Magnesium Chalk Knurling Grip",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-1229356",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-114",
    "title": "Athletic Sled Push Drive",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1518611012118-696072aa579a",
    "author": "Scott Webb",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-115",
    "title": "Snowcapped Granite Massif",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-1287145",
    "author": "Eberhard Grossgasteiger",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#E5E7EB"
    }
  },
  {
    "id": "wp-116",
    "title": "High Altitude Glacial Skyrun",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-280014",
    "author": "Pixabay",
    "ringColors": {
      "outer": "#0284C7",
      "middle": "#0369A1",
      "inner": "#BAE6FD"
    }
  },
  {
    "id": "wp-117",
    "title": "Classic Most Muscular Silhouette",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-8032735",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#92400E",
      "inner": "#FEF3C7"
    }
  },
  {
    "id": "wp-118",
    "title": "Race Bib Athlete Focus & Sweat",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-3775164",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-119",
    "title": "Powerlifting Monolift Rack",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-5327529",
    "author": "Ivan Samkov",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-120",
    "title": "Barbell Clean & Jerk Catch Phase",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1575052814086-f385e2e2ad1b",
    "author": "John Arano",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-121",
    "title": "Starry Night Over Alpine Ridge",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-1624496",
    "author": "Benjamin Voros",
    "ringColors": {
      "outer": "#4F46E5",
      "middle": "#4338CA",
      "inner": "#C7D2FE"
    }
  },
  {
    "id": "wp-122",
    "title": "Marathon Sunset Coastal Stride",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-2387873",
    "author": "Vlad Bagacian",
    "ringColors": {
      "outer": "#EA580C",
      "middle": "#C2410C",
      "inner": "#FFEDD5"
    }
  },
  {
    "id": "wp-123",
    "title": "Pro Muscle Hardening Lockout",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-7991918",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#374151",
      "middle": "#1F2937",
      "inner": "#9CA3AF"
    }
  },
  {
    "id": "wp-124",
    "title": "Hyrox Sandbag Walking Lunges",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4162487",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#EA580C",
      "middle": "#C2410C",
      "inner": "#FFEDD5"
    }
  },
  {
    "id": "wp-125",
    "title": "Steel Cast Kettlebell Rack",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-416809",
    "author": "Scott Webb",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#1F2937",
      "inner": "#9CA3AF"
    }
  },
  {
    "id": "wp-126",
    "title": "Powerlifter Belt Tightening",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1518310383802-640c2de311b2",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-127",
    "title": "Pristine Emerald Mountain Lake",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-417074",
    "author": "James Wheeler",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-128",
    "title": "Trail Runner Golden Meadow",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-3621104",
    "author": "Run FF",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-129",
    "title": "Olympia Tanned Heavy Pulldown",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-7991924",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-130",
    "title": "Hyrox SkiErg Cadence Drive",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4162489",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#DBEAFE"
    }
  },
  {
    "id": "wp-131",
    "title": "Barbell Collar Lock Steel",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-416717",
    "author": "Scott Webb",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-132",
    "title": "Sprinter Blocks Explosive Drive",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "photo-1461896836934-ffe607ba8211",
    "author": "Braden Collum",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#93C5FD"
    }
  },
  {
    "id": "wp-133",
    "title": "Morning Mist Across Alpine Pines",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-3408744",
    "author": "Rachel Claire",
    "ringColors": {
      "outer": "#047857",
      "middle": "#065F46",
      "inner": "#6EE7B7"
    }
  },
  {
    "id": "wp-134",
    "title": "Hill Climb Sprint Power",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-3621108",
    "author": "Run FF",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-135",
    "title": "Stage Aesthetic Torso Angles",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-3775566",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-136",
    "title": "RowErg 1000m Split Power",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4162491",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-137",
    "title": "Chrome Dumbbell Precision Rows",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-416754",
    "author": "Scott Webb",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-138",
    "title": "Female Athlete Heavy Dumbbell Press",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-2294354",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-139",
    "title": "Rugged Mountain Pass Summit",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-3225517",
    "author": "Michael Block",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-140",
    "title": "Urban Twilight River Run",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-3764014",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#3B82F6",
      "middle": "#2563EB",
      "inner": "#93C5FD"
    }
  },
  {
    "id": "wp-141",
    "title": "Golden Era Physique Profile",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-3775594",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-142",
    "title": "Turf Sled Sprint Acceleration",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4162492",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-143",
    "title": "Heavy Olympic Plate Stack",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-1552250",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-144",
    "title": "Athlete Barbell Hip Thrust Drive",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-2261484",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-145",
    "title": "Deep Forest Pine Needle Trail",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-1761279",
    "author": "Jacob Colvin",
    "ringColors": {
      "outer": "#065F46",
      "middle": "#064E3B",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-146",
    "title": "High Stride Interval Pace",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-3764011",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-147",
    "title": "Physique Championship Contender",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-3775603",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-148",
    "title": "Wall Ball Target Depth Squat",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4162494",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-149",
    "title": "Gym Iron Silence Morning",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "pexels-1552244",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#374151",
      "middle": "#1F2937",
      "inner": "#9CA3AF"
    }
  },
  {
    "id": "wp-150",
    "title": "Athlete Deadlift Shin Position",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-2294363",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-151",
    "title": "Alpine Glacier Blue Ice Crevasse",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-1366919",
    "author": "Eberhard Grossgasteiger",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#93C5FD"
    }
  },
  {
    "id": "wp-152",
    "title": "Endurance Athlete Deep Breath",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-3764016",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-153",
    "title": "Bicep Peak Warm Stage Spotlight",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-3775574",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-154",
    "title": "Hyrox Finish Line Triumphant",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4164761",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-155",
    "title": "Chalk Dust and Calisthenics Bars",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1521804906057-1df8fdb718b7",
    "author": "Anastase Maragos",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#D1D5DB"
    }
  },
  {
    "id": "wp-156",
    "title": "Heavy Barbell Clean Extension",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-2261480",
    "author": "Li Sun",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#D1D5DB"
    }
  },
  {
    "id": "wp-157",
    "title": "Granite Peak Morning Glow",
    "category": "nature",
    "categoryLabel": "Nature & Alpine",
    "photoId": "pexels-1366957",
    "author": "Eberhard Grossgasteiger",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-158",
    "title": "Forest Trail Morning Sunshine Stride",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-235922",
    "author": "Pixabay",
    "ringColors": {
      "outer": "#047857",
      "middle": "#065F46",
      "inner": "#6EE7B7"
    }
  },
  {
    "id": "wp-159",
    "title": "Front Relaxed Symmetrical Stance",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-3775578",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-160",
    "title": "Race Arena Bleachers Atmosphere",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4164762",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#4B5563",
      "middle": "#374151",
      "inner": "#D1D5DB"
    }
  },
  {
    "id": "wp-161",
    "title": "Cast Iron Kettlebell Arsenal",
    "category": "gym",
    "categoryLabel": "Gym Floor & Iron",
    "photoId": "photo-1532029837206-abbe2b7620e3",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-162",
    "title": "Dumbbell Seated Shoulder Press Cut",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-3838935",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-163",
    "title": "Alpine Peak Descent Stride",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-601174",
    "author": "Flo Maderebner",
    "ringColors": {
      "outer": "#0284C7",
      "middle": "#0369A1",
      "inner": "#BAE6FD"
    }
  },
  {
    "id": "wp-164",
    "title": "Olympia Stage Lighting Back Flex",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "photo-1583454110551-21f2fa2afe61",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-165",
    "title": "Championship Heat Starting Gate",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "pexels-4164763",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-166",
    "title": "Incline Dumbbell Flyes Squeeze",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-3838936",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-167",
    "title": "Open Road Marathon Cadence",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-1571939",
    "author": "Runs",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-168",
    "title": "Classic Iron Posing Stance",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "photo-1583454155184-870a1f63aebc",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-169",
    "title": "Functional Rig Muscle Ups",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "photo-1517838277536-f5f99be501cd",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-170",
    "title": "Bicep Peak Under Warm Light",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-3838938",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-171",
    "title": "Coastal Trail Runner Horizons",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-2526878",
    "author": "Run FF",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-172",
    "title": "Physique Muscle Contraction",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "photo-1571019613454-1cb2f99b2d8b",
    "author": "Alora Griffiths",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-173",
    "title": "Turf Conditioning Sprint Sled",
    "category": "hyrox",
    "categoryLabel": "Hyrox & Racing",
    "photoId": "photo-1574680096145-d05b474e2155",
    "author": "Humphrey Muleba",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-174",
    "title": "Dumbbell Renegade Rows Turf",
    "category": "athlete",
    "categoryLabel": "Gym Athletes",
    "photoId": "pexels-3839075",
    "author": "Polina Tankilevitch",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-175",
    "title": "Speed Work Accelerations",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-2526876",
    "author": "Run FF",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-176",
    "title": "Gold Trophy Pre-Judged Quad Sweep",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-1552251",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-177",
    "title": "Sunrise Ridge Skyrunner Stride",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-2402777",
    "author": "Flo Maderebner",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-178",
    "title": "Stage Abs and Thighs Lockdown",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-1552246",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-179",
    "title": "Mountain Alpine Pass Cycling Turn",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-2403568",
    "author": "Flo Maderebner",
    "ringColors": {
      "outer": "#2563EB",
      "middle": "#1D4ED8",
      "inner": "#BFDBFE"
    }
  },
  {
    "id": "wp-180",
    "title": "Posing Routine Transition Flow",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-1552247",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-181",
    "title": "Forest Trail Sunbeams Acceleration",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-2403502",
    "author": "Flo Maderebner",
    "ringColors": {
      "outer": "#047857",
      "middle": "#065F46",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-182",
    "title": "Championship Bicep Clench",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-1552243",
    "author": "Victor Freitas",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-183",
    "title": "Rocky Trail Summit Marathon",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-618612",
    "author": "Flo Maderebner",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-184",
    "title": "Stage Lighting Deltoid Cap",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-7991925",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-185",
    "title": "Morning Forest Jog Reflections",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-116077",
    "author": "Pixabay",
    "ringColors": {
      "outer": "#059669",
      "middle": "#047857",
      "inner": "#A7F3D0"
    }
  },
  {
    "id": "wp-186",
    "title": "Warmup Dumbbell Lateral Raise",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-7991665",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-187",
    "title": "Track Hurdles Power Flight",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-936094",
    "author": "Pixabay",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-188",
    "title": "Pre-Stage Back Pump Rows",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-7991660",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#374151",
      "middle": "#1F2937",
      "inner": "#9CA3AF"
    }
  },
  {
    "id": "wp-189",
    "title": "Stadium Lap Line Sprints",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-868483",
    "author": "Pixabay",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-190",
    "title": "Classic Symmetry Stage Pose",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-7991923",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-191",
    "title": "Athlete Sprint Shadows on Turf",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-1199590",
    "author": "Pixabay",
    "ringColors": {
      "outer": "#374151",
      "middle": "#1F2937",
      "inner": "#9CA3AF"
    }
  },
  {
    "id": "wp-192",
    "title": "Most Muscular Arnold Classic Tribute",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-8032731",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-193",
    "title": "Mountain Alpine Pass Glider Vista",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-1680140",
    "author": "Flo Maderebner",
    "ringColors": {
      "outer": "#0284C7",
      "middle": "#0369A1",
      "inner": "#BAE6FD"
    }
  },
  {
    "id": "wp-194",
    "title": "Back Double Bicep Stage Peak",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-8032734",
    "author": "Mikhail Nilov",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-195",
    "title": "Alpine Crest Skyrunner Trail",
    "category": "outdoor",
    "categoryLabel": "Outdoor Activities",
    "photoId": "pexels-618613",
    "author": "Flo Maderebner",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-196",
    "title": "Bicep Vascularity Spotlight",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-4761793",
    "author": "Tima Miroshnichenko",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#EF4444",
      "inner": "#FCA5A5"
    }
  },
  {
    "id": "wp-197",
    "title": "Chest Expansion Classic Profile",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-4761788",
    "author": "Tima Miroshnichenko",
    "ringColors": {
      "outer": "#F59E0B",
      "middle": "#D97706",
      "inner": "#FDE68A"
    }
  },
  {
    "id": "wp-198",
    "title": "Abdominal Vacuum Classic Era",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-4761789",
    "author": "Tima Miroshnichenko",
    "ringColors": {
      "outer": "#DC2626",
      "middle": "#B91C1C",
      "inner": "#FECACA"
    }
  },
  {
    "id": "wp-199",
    "title": "Deltoid Separation Iron Stage",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-6550824",
    "author": "Cesar Galeão",
    "ringColors": {
      "outer": "#374151",
      "middle": "#1F2937",
      "inner": "#9CA3AF"
    }
  },
  {
    "id": "wp-200",
    "title": "Heavy Cable Cross Pump",
    "category": "olympia",
    "categoryLabel": "Mr. Olympia & Stage",
    "photoId": "pexels-3768915",
    "author": "Andrea Piacquadio",
    "ringColors": {
      "outer": "#D97706",
      "middle": "#B45309",
      "inner": "#FDE68A"
    }
  }
];

export const CURATED_200_WALLPAPERS = CURATED_100_WALLPAPERS;

export function getCuratedWallpaperUrl(photoId: string, width = 1400, quality = 80): string {
  if (photoId.startsWith('http://') || photoId.startsWith('https://')) {
    return photoId;
  }
  if (photoId.startsWith('pexels-')) {
    const id = photoId.replace('pexels-', '');
    return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
  }
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

export function getCuratedThumbUrl(photoId: string): string {
  if (photoId.startsWith('http://') || photoId.startsWith('https://')) {
    return photoId;
  }
  if (photoId.startsWith('pexels-')) {
    const id = photoId.replace('pexels-', '');
    return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400`;
  }
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=400&q=70`;
}
