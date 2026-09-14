import fs from 'fs';
import esbuild from 'esbuild';

const bundlePath = 'assets/index-BWUawsaP.js';
let bundle = fs.readFileSync('assets/index-BWUawsaP.js.bak', 'utf8');

console.log('Original backup bundle size:', bundle.length);

// 0. Global Swipes Memory Store for reciprocal matching across personas
if (!bundle.includes('globalThis.__o1fc_swipes')) {
  bundle = 'globalThis.__o1fc_swipes=globalThis.__o1fc_swipes||new Set();' + bundle;
  console.log('0. globalThis.__o1fc_swipes initialized');
}

// 1. Extract exact oldXE and replace with rich global athlete directory
const oldXE = bundle.substring(
  bundle.indexOf('const xE=['),
  bundle.indexOf(';function S2(e,t){')
);

const richGlobalAthletes = `const xE = [
  // --- MELBOURNE (Chapel St, South Yarra, Ringwood, Flinders St) ---
  {
    name: "Alex Torres",
    gender: "male",
    seeking: "both",
    age: 27,
    height: 183,
    weight: 88,
    show_weight: true,
    training_focus: "Mass & Hypertrophy",
    discipline: "Hypertrophy",
    secondary_discipline: "Bodybuilding",
    level: "Advanced",
    time: "Evening (4-7 PM)",
    homeGym: "Doherty's Gym Flinders St",
    currentGym: "Doherty's Gym Flinders St",
    city: "Melbourne",
    country: "Australia",
    latitude: -37.8170,
    longitude: 144.9650,
    bio: "Focusing on heavy compounds and chest/back hypertrophy. Train at Doherty's Flinders St and Chapel St gyms. Looking for an intense workout partner or gym date.",
    photos: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    name: "Chloe Bennett",
    gender: "female",
    seeking: "both",
    age: 25,
    height: 168,
    weight: 59,
    show_weight: true,
    training_focus: "Hyrox & Reformer",
    discipline: "Hyrox",
    secondary_discipline: "Yoga & Pilates",
    level: "Advanced",
    time: "Morning (7-9 AM)",
    homeGym: "South Yarra Club",
    currentGym: "Chapel St Athletic Club",
    city: "Melbourne",
    country: "Australia",
    latitude: -37.8398,
    longitude: 144.9928,
    bio: "Prepping for Hyrox Melbourne doubles. Split between sled pushes, rowing intervals, and reformer pilates on Chapel St. Love early morning high-energy sessions.",
    photos: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    name: "Jack O'Connor",
    gender: "male",
    seeking: "workout partner",
    age: 29,
    height: 182,
    weight: 96,
    show_weight: true,
    training_focus: "SBD Powerlifting Prep",
    discipline: "Powerlifting",
    secondary_discipline: "Olympic Lifting",
    level: "Elite",
    time: "Evening (4-7 PM)",
    homeGym: "Ringwood Barbell Club",
    currentGym: "Ringwood Barbell Club",
    city: "Melbourne",
    country: "Australia",
    latitude: -37.8142,
    longitude: 145.2285,
    bio: "Competitive powerlifter chasing 650kg total. Heavy squat rack sessions, deadlift platforms, and chalk. Always down for calibrated plate training.",
    photos: [
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80"
    ]
  },

  // --- SYDNEY (Bondi, Surry Hills, Glebe) ---
  {
    name: "Liam Campbell",
    gender: "male",
    seeking: "both",
    age: 28,
    height: 185,
    weight: 92,
    show_weight: true,
    training_focus: "Heavy Iron & RDLs",
    discipline: "Powerlifting",
    secondary_discipline: "Hypertrophy",
    level: "Advanced",
    time: "Evening (4-7 PM)",
    homeGym: "PowerHouse Surry Hills",
    currentGym: "Iron Works Barbell HQ",
    city: "Sydney",
    country: "Australia",
    latitude: -33.8821,
    longitude: 151.2114,
    bio: "Surry Hills local. 5-day split hitting heavy RDLs, squats, and overhead presses. Love grabbing post-workout protein bowls and chatting training philosophies.",
    photos: [
      "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    name: "Maya Patel",
    gender: "female",
    seeking: "both",
    age: 26,
    height: 167,
    weight: 63,
    show_weight: true,
    training_focus: "MetCon & Snatch",
    discipline: "CrossFit",
    secondary_discipline: "Olympic Lifting",
    level: "Elite",
    time: "Morning (7-9 AM)",
    homeGym: "CrossFit Bondi",
    currentGym: "CrossFit Bondi",
    city: "Sydney",
    country: "Australia",
    latitude: -33.8915,
    longitude: 151.2767,
    bio: "Bondi Beach resident. Olympic lifting, kettlebells, and gymnastics ring work. Sunrise Bondi hill sprints followed by flat whites.",
    photos: [
      "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    name: "Samara Vance",
    gender: "female",
    seeking: "workout partner",
    age: 24,
    height: 165,
    weight: 54,
    show_weight: false,
    training_focus: "Calisthenics & Flow",
    discipline: "Calisthenics",
    secondary_discipline: "Yoga & Pilates",
    level: "Intermediate",
    time: "Early Bird (5-7 AM)",
    homeGym: "Bondi Outdoor Gym",
    currentGym: "Bondi Beach Calisthenics",
    city: "Sydney",
    country: "Australia",
    latitude: -33.8910,
    longitude: 151.2750,
    bio: "Muscle-ups, handstand balancing, and beach mobility drills. Training outdoors every morning regardless of weather.",
    photos: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80"
    ]
  },

  // --- GOLD COAST (Surfers Paradise, Burleigh) ---
  {
    name: "Kai Harrison",
    gender: "male",
    seeking: "both",
    age: 26,
    height: 180,
    weight: 82,
    show_weight: true,
    training_focus: "Aesthetic Conditioning",
    discipline: "Calisthenics",
    secondary_discipline: "Hypertrophy",
    level: "Advanced",
    time: "Afternoon (1-4 PM)",
    homeGym: "Burleigh Barbell",
    currentGym: "World Gym Burleigh",
    city: "Gold Coast",
    country: "Australia",
    latitude: -28.0870,
    longitude: 153.4470,
    bio: "Burleigh Heads lifter. Heavy weighted dips, weighted pull-ups, and beach sprints. Looking for someone driven to push intensity.",
    photos: [
      "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    name: "Sienna Brooks",
    gender: "female",
    seeking: "gym date",
    age: 23,
    height: 170,
    weight: 60,
    show_weight: false,
    training_focus: "Surf Performance & Core",
    discipline: "Yoga & Pilates",
    secondary_discipline: "Functional",
    level: "Intermediate",
    time: "Morning (7-9 AM)",
    homeGym: "Surfers Paradise Fitness HQ",
    currentGym: "Surfers Paradise Fitness HQ",
    city: "Gold Coast",
    country: "Australia",
    latitude: -28.0024,
    longitude: 153.4295,
    bio: "Surfers Paradise. Functional core strength, stability, and reformer pilates. Great coffee after a solid sweat session.",
    photos: [
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80"
    ]
  },

  // --- MIAMI, FLORIDA (South Beach, Brickell) ---
  {
    name: "Marco Rodriguez",
    gender: "male",
    seeking: "both",
    age: 30,
    height: 186,
    weight: 95,
    show_weight: true,
    training_focus: "Classic Physique Hypertrophy",
    discipline: "Bodybuilding",
    secondary_discipline: "Hypertrophy",
    level: "Elite",
    time: "Evening (4-7 PM)",
    homeGym: "Anatomy Miami Beach",
    currentGym: "Anatomy Miami Beach",
    city: "Miami",
    country: "United States",
    latitude: 25.7907,
    longitude: -80.1300,
    bio: "South Beach bodybuilder. High-volume leg days, cold plunges, and macro precision. Seeking a committed training partner or gym date in Miami.",
    photos: [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    name: "Sofia Valenzuela",
    gender: "female",
    seeking: "both",
    age: 27,
    height: 169,
    weight: 61,
    show_weight: true,
    training_focus: "Hyrox & High Intensity",
    discipline: "Hyrox",
    secondary_discipline: "HIIT",
    level: "Advanced",
    time: "Morning (7-9 AM)",
    homeGym: "Elev8tion Fitness Brickell",
    currentGym: "Elev8tion Fitness Brickell",
    city: "Miami",
    country: "United States",
    latitude: 25.7617,
    longitude: -80.1918,
    bio: "Brickell resident training at Elev8tion. Hyrox racer, ski erg intervals, and heavy wall balls. High energy only.",
    photos: [
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80"
    ]
  },

  // --- LONDON (Shoreditch, Canary Wharf, Soho) ---
  {
    name: "Elena Rostova",
    gender: "female",
    seeking: "both",
    age: 26,
    height: 172,
    weight: 62,
    show_weight: true,
    training_focus: "Hyrox Engine & Pilates",
    discipline: "Hyrox",
    secondary_discipline: "Yoga & Pilates",
    level: "Advanced",
    time: "Morning (7-9 AM)",
    homeGym: "Gymbox Bank",
    currentGym: "Third Space Soho",
    city: "London",
    country: "United Kingdom",
    is_travel_mode: true,
    travel_city: "London",
    travel_country: "UK",
    latitude: 51.5126,
    longitude: -0.0864,
    bio: "Visiting athlete. Hyrox competitor & pilates addict. Currently hitting Gymbox Bank & Third Space. Down to connect for a session or healthy brunch.",
    photos: [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    name: "Marcus Vance",
    gender: "male",
    seeking: "both",
    age: 31,
    height: 184,
    weight: 86,
    show_weight: true,
    training_focus: "Boxing & Functional Strength",
    discipline: "Functional",
    secondary_discipline: "Martial Arts",
    level: "Elite",
    time: "Evening (4-7 PM)",
    homeGym: "Third Space Soho",
    currentGym: "Canary Wharf Health Club",
    city: "London",
    country: "United Kingdom",
    is_travel_mode: true,
    travel_city: "London",
    travel_country: "UK",
    latitude: 51.5115,
    longitude: -0.1370,
    bio: "Heavy bag combinations, kettlebells, and functional compound lifting across Shoreditch and Soho. Seeking a sparring/workout partner.",
    photos: [
      "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
    ]
  },

  // --- LOS ANGELES (Venice Beach, West Hollywood, Downtown) ---
  {
    name: "Brandon Cole",
    gender: "male",
    seeking: "both",
    age: 28,
    height: 188,
    weight: 98,
    show_weight: true,
    training_focus: "The Mecca Heavy Hypertrophy",
    discipline: "Bodybuilding",
    secondary_discipline: "Hypertrophy",
    level: "Elite",
    time: "Evening (4-7 PM)",
    homeGym: "Gold's Gym Venice (The Mecca)",
    currentGym: "Gold's Gym Venice",
    city: "Los Angeles",
    country: "United States",
    latitude: 33.9922,
    longitude: -118.4735,
    bio: "Daily training at The Mecca in Venice. Heavy incline dumbbells, hack squats, and outdoor posing yard. Passionate about bodybuilding culture.",
    photos: [
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80"
    ]
  },
  {
    name: "Mia Zhang",
    gender: "female",
    seeking: "both",
    age: 25,
    height: 166,
    weight: 64,
    show_weight: true,
    training_focus: "Olympic Weightlifting & Glute Hypertrophy",
    discipline: "Olympic Lifting",
    secondary_discipline: "Hypertrophy",
    level: "Advanced",
    time: "Morning (7-9 AM)",
    homeGym: "Barbell Brigade DTLA",
    currentGym: "Equinox West Hollywood",
    city: "Los Angeles",
    country: "United States",
    latitude: 34.0371,
    longitude: -118.2642,
    bio: "Clean & jerks at Barbell Brigade, recovery in WeHo. Focusing on strength mechanics and lifting technique.",
    photos: [
      "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80"
    ]
  }
]`;

bundle = bundle.replace(oldXE, richGlobalAthletes);
console.log('1. Rich global athlete directory inserted (14 diverse profiles across 6 hubs)');

// 2. Extract exact oldS2 and replace with satellite projection + native distance logic
const oldS2 = bundle.substring(
  bundle.indexOf('function S2(e,t){'),
  bundle.indexOf('}const mc=[') + 1
);

const newS2Code = `function S2(e,t){
  const offsets=[2.1, 3.8, 6.2, 9.5, 14.2, 19.8, 28.5, 39.0, 52.0, 75.0, 110.0, 145.0, 190.0, 235.0];
  return xE.map((n, s) => {
    const directDist = D7(e, t, n.latitude, n.longitude);
    let lat = n.latitude;
    let lng = n.longitude;
    let dist = Math.round(directDist * 10) / 10;
    
    if (directDist > 250) {
      const radiusKm = offsets[s % offsets.length];
      const angle = (s * (360 / xE.length)) * Math.PI / 180;
      const dLat = (radiusKm / 111) * Math.cos(angle);
      const dLng = (radiusKm / (111 * Math.max(0.1, Math.cos(e * Math.PI / 180)))) * Math.sin(angle);
      lat = e + dLat;
      lng = t + dLng;
      dist = Math.round(D7(e, t, lat, lng) * 10) / 10;
    }

    const email = (n.name.toLowerCase().replace(/[^a-z0-9]/g, ".") + "@o1fc.app");
    return {
      id: "mock-" + s + "-" + n.name.toLowerCase().replace(/\\s+/g, "-"),
      user_email: email,
      user_name: n.name,
      avatar_url: n.photos[0] || "",
      handle: "@" + n.name.toLowerCase().replace(/\\s+/g, "_"),
      photos: n.photos,
      gender: n.gender || "all",
      seeking: n.seeking || "both",
      age: n.age,
      height: n.height,
      weight: n.weight,
      show_weight: n.show_weight ?? true,
      training_focus: n.training_focus || n.discipline,
      discipline: n.discipline,
      secondary_discipline: n.secondary_discipline || "",
      experience_level: n.level,
      preferred_time: n.time,
      home_gym: n.homeGym,
      current_gym: n.currentGym || n.homeGym,
      city: n.city,
      country: n.country,
      bio: n.bio || "",
      gym_zone_sharing: true,
      public_telemetry: true,
      is_ghost_mode: false,
      latitude: lat,
      longitude: lng,
      last_active_at: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      distance_km: dist,
      is_demo: true,
      is_travel_mode: !!n.is_travel_mode,
      travel_city: n.travel_city || (n.is_travel_mode ? n.city : ""),
      travel_country: n.travel_country || (n.is_travel_mode ? n.country : "")
    };
  });
}`;

bundle = bundle.replace(oldS2, newS2Code);
console.log('2. S2 distance and global seed projection logic updated');

// 3. Update mc array to include Melbourne, Gold Coast, Miami
const oldMcStart = 'const mc=[{id:"nyc"';
const melbourneEntry = `{id:"mel",name:"Melbourne",country:"Australia",lat:-37.8136,lng:144.9631,gyms:[{name:"Doherty's Gym Flinders St",address:"215 Flinders St, Melbourne VIC 3000",category:"Historic Hypertrophy & 24/7 Iron",lat:-37.8170,lng:144.9650},{name:"South Yarra Club",address:"652 Chapel St, South Yarra VIC 3141",category:"Elite Functional & Reformer",lat:-37.8398,lng:144.9928},{name:"Ringwood Barbell Club",address:"8 Maroondah Hwy, Ringwood VIC 3134",category:"Powerlifting & Heavy Squat Racks",lat:-37.8142,lng:145.2285},{name:"Prahran Fitness Hub",address:"210 Commercial Rd, Prahran VIC 3181",category:"CrossFit & MetCon",lat:-37.8480,lng:144.9940}]},{id:"gld",name:"Gold Coast",country:"Australia",lat:-28.0167,lng:153.4000,gyms:[{name:"Burleigh Barbell",address:"12 James St, Burleigh Heads QLD 4220",category:"Beachfront Strength",lat:-28.0870,lng:153.4470},{name:"World Gym Burleigh",address:"17 Reedy Creek Rd, Burleigh QLD 4220",category:"Bodybuilding Warehouse",lat:-28.0930,lng:153.4420},{name:"Surfers Paradise Fitness HQ",address:"The Esplanade, Surfers Paradise QLD 4217",category:"24/7 Functional Conditioning",lat:-28.0024,lng:153.4295}]},{id:"mia",name:"Miami",country:"United States",lat:25.7617,lng:-80.1918,gyms:[{name:"Anatomy Miami Beach",address:"1220 20th St, Miami Beach, FL 33139",category:"South Beach Luxury & Hypertrophy",lat:25.7907,lng:-80.1300},{name:"Elev8tion Fitness Brickell",address:"1625 S Miami Ave, Miami, FL 33129",category:"Hardcore Iron & Conditioning",lat:25.7617,lng:-80.1918},{name:"South Beach Calisthenics",address:"9th St & Ocean Dr, Miami Beach, FL 33139",category:"Ocean Beachfront Bodyweight",lat:25.7790,lng:-80.1305}]},`;
bundle = bundle.replace(oldMcStart, 'const mc=[' + melbourneEntry + '{id:"nyc"');
console.log('3. Melbourne, Gold Coast, and Miami added to mc global gym database');

// 4. Update k2 & Disciplines list
const oldK2 = 'k2={ageRange:[18,55],radiusKm:25,disciplines:[],preferredTimes:[]}';
const newK2 = 'k2={ageRange:[18,55],radiusKm:25,disciplines:[],preferredTimes:[],gender:"all"}';
bundle = bundle.replace(oldK2, newK2);

const oldNj = 'Nj=["Hypertrophy","Powerlifting","CrossFit","Calisthenics","Olympic Lifting","Bodybuilding","Functional","HIIT","Endurance","Martial Arts","Yoga","Sport-Specific"]';
const newNj = 'Nj=["Hypertrophy","Powerlifting","CrossFit","Yoga & Pilates","Hyrox","Calisthenics","Olympic Lifting","Bodybuilding","Functional","HIIT","Endurance","Martial Arts"]';
bundle = bundle.replace(oldNj, newNj);
console.log('4. k2 and Nj disciplines updated with Yoga & Pilates and Hyrox');

// 5. Update Mce with Gender and Disciplines filtering
const oldMce = bundle.substring(
  bundle.indexOf('async function Mce(e,t,a,n,s=40,i=!1){'),
  bundle.indexOf('}async function Ece(e){') + 1
);

const newMceCode = `async function Mce(e,t,a,n,s=40,i=!1){
  const o="radar_"+t.toFixed(2)+"_"+a.toFixed(2)+"_"+n.radiusKm+"_"+(n.gender||"all")+"_"+n.disciplines.join(",")+"_"+(i?"mock":"live");
  const c=c0.get(o);
  if(c&&Date.now()-c.timestamp<15e3)return c.data;
  let liveProfiles=[];
  if(at()&&_e){
    try{
      let qyData=null;
      try{
        const { data: rpcAthletes, error: rpcErr } = await _e.rpc("get_nearby_athletes", {
          requesting_user_id: e,
          search_radius_meters: n.radiusKm * 1000
        });
        if(!rpcErr && rpcAthletes && Array.isArray(rpcAthletes) && rpcAthletes.length > 0){
          qyData = rpcAthletes;
        }
      }catch(rpcEx){}

      if(!qyData || qyData.length === 0){
        const h=1/111.32,p=n.radiusKm*h,cosLat=Math.max(0.01,Math.cos(t*Math.PI/180)),f=n.radiusKm*h/cosLat;
        let qy=await _e.from("buddy_profiles").select("*").neq("user_email",e).eq("is_ghost_mode",!1).gte("latitude",t-p).lte("latitude",t+p).gte("longitude",a-f).lte("longitude",a+f).limit(s);
        if((!qy.data||qy.data.length===0)&&!qy.error){
          qy=await _e.from("buddy_profiles").select("*").neq("user_email",e).eq("is_ghost_mode",!1).limit(s);
        }
        if(qy.error||!qy.data||qy.data.length===0){
          qy=await _e.from("profiles").select("id, user_email, user_name, avatar_url, handle, photos, age, height, weight, show_weight, training_focus, discipline, experience_level, preferred_time, home_gym, current_gym, gym_zone_sharing, public_telemetry, is_ghost_mode, latitude, longitude, last_active_at").neq("user_email",e).eq("is_ghost_mode",!1).limit(s);
        }
        qyData = qy.data;
      }

      if(qyData&&qyData.length>0){
        liveProfiles=qyData.map(k=>{
          const isTravel=!!k.is_travel_mode;
          const lat=isTravel&&typeof k.travel_latitude==="number"?k.travel_latitude:(typeof k.latitude==="number"?k.latitude:t);
          const lng=isTravel&&typeof k.travel_longitude==="number"?k.travel_longitude:(typeof k.longitude==="number"?k.longitude:a);
          const dist=Math.round(D7(t,a,lat,lng)*10)/10;
          return{
            id:k.id||("live-"+k.user_email),
            user_email:k.user_email,
            user_name:k.user_name||k.display_name||"Athlete",
            avatar_url:k.avatar_url||"",
            handle:k.handle||("@"+(k.user_name||"athlete").toLowerCase().replace(/\\s+/g,"_")),
            photos:Array.isArray(k.photos)&&k.photos.length>0?k.photos:(k.avatar_url?[k.avatar_url]:[]),
            gender:k.gender||"male",
            age:k.age||26,
            height:k.height||178,
            weight:k.weight||75,
            show_weight:k.show_weight??!0,
            training_focus:k.training_focus||k.discipline||"Hypertrophy",
            discipline:k.discipline||k.training_focus||"Hypertrophy",
            experience_level:k.experience_level||"Intermediate",
            preferred_time:k.preferred_time||"Evening (4-7 PM)",
            home_gym:k.home_gym||"Iron Works",
            current_gym:k.current_gym||k.home_gym||"Iron Works",
            gym_zone_sharing:k.gym_zone_sharing??!0,
            public_telemetry:k.public_telemetry??!0,
            is_ghost_mode:k.is_ghost_mode??!1,
            latitude:lat,
            longitude:lng,
            last_active_at:k.last_active_at||new Date().toISOString(),
            distance_km:dist,
            is_demo:!1,
            is_travel_mode:isTravel,
            travel_city:k.travel_city||"",
            travel_country:k.travel_country||""
          };
        }).filter(k=>{
          if(k.age<n.ageRange[0]||k.age>n.ageRange[1])return!1;
          if(k.distance_km>n.radiusKm)return!1;
          if(n.gender&&n.gender!=="all"&&k.gender&&k.gender!==n.gender)return!1;
          if(n.disciplines.length>0&&!n.disciplines.some(d=>k.discipline.toLowerCase().includes(d.toLowerCase())))return!1;
          if(n.preferredTimes.length>0&&!n.preferredTimes.includes(k.preferred_time))return!1;
          return!0;
        }).sort((k,P)=>(k.distance_km??999)-(P.distance_km??999));
      }
    }catch(err){console.warn("[BuddyRadarStore] buddy_profiles query fallback:",err)}
  }
  let res=[...liveProfiles];
  if(res.length<6||i){
    const demos=S2(t,a).filter(k=>{
      if(k.user_email===e)return!1;
      if(k.age<n.ageRange[0]||k.age>n.ageRange[1])return!1;
      if(k.distance_km>n.radiusKm)return!1;
      if(n.gender&&n.gender!=="all"&&k.gender&&k.gender!==n.gender)return!1;
      if(n.disciplines.length>0&&!n.disciplines.some(d=>(k.discipline&&k.discipline.toLowerCase().includes(d.toLowerCase()))||(k.training_focus&&k.training_focus.toLowerCase().includes(d.toLowerCase()))))return!1;
      if(n.preferredTimes.length>0&&!n.preferredTimes.includes(k.preferred_time))return!1;
      return!0;
    });
    for(const dp of demos){
      if(!res.some(ex=>ex.user_email===dp.user_email)){
        res.push(dp);
      }
      if(res.length>=Math.max(14,s))break;
    }
  }
  c0.set(o,{data:res,timestamp:Date.now()});
  return res;
}`;

bundle = bundle.replace(oldMce, newMceCode);
console.log('5. Mce patched with gender and discipline filtering');

// 6. Update Yce (Filter Drawer Component) to include "Looking For" (Men, Women, Everyone)
const oldYceHeader = bundle.substring(
  bundle.indexOf('Yce=({filters:e,setFilters:t,'),
  bundle.indexOf('children:[r.jsx(cn,{className:"w-3 h-3"})," Reset"]})]}),') + 'children:[r.jsx(cn,{className:"w-3 h-3"})," Reset"]})]}),'.length
);

const newYceLookingFor = `r.jsxs("div",{className:"mb-5",children:[r.jsx("label",{className:"text-zinc-700 dark:text-white/60 text-xs font-medium mb-2 block",children:"Looking For"}),r.jsx("div",{className:"flex flex-wrap gap-1.5",children:[{label:"Everyone",val:"all"},{label:"Men",val:"male"},{label:"Women",val:"female"}].map(gOpt=>{const isSel=(e.gender||"all")===gOpt.val;return r.jsx("button",{key:gOpt.val,onClick:()=>t({...e,gender:gOpt.val}),className:"px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 cursor-pointer "+(isSel?"bg-red-500 text-white shadow-sm shadow-red-500/30":"bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-white/50 border border-zinc-200/60 dark:border-white/[0.08]"),children:gOpt.label})})})]}),`;

bundle = bundle.replace(oldYceHeader, oldYceHeader + newYceLookingFor);
console.log('6. "Looking For" gender selection chips added to Yce filter component');

// 7. Update j2 swipe recorder to persist to Supabase & memory cache
const oldJ2 = 'function j2(e,t,a){KF.recordSwipe({userId:e,targetId:t,action:a,timestamp:Date.now()})}';
const newJ2 = `async function j2(e,t,a){
  KF.recordSwipe({userId:e,targetId:t,action:a,timestamp:Date.now()});
  try{
    if(globalThis.__o1fc_swipes){
      globalThis.__o1fc_swipes.add(e.toLowerCase()+"->"+t.toLowerCase()+":"+a);
    }
  }catch{}
  if(at()&&_e){
    try{
      await _e.from("buddy_swipes").insert({user_id:e.toLowerCase(),target_id:t.toLowerCase(),action:a,created_at:new Date().toISOString()});
    }catch(err){console.warn("[buddy_swipes] swipe insert fallback:",err)}
  }
}`;
bundle = bundle.replace(oldJ2, newJ2);
console.log('7. j2 swipe recorder patched');

// 8. Update Kce (Gym Session Booking card) with "Accept & Confirm" button
const oldSuggestBtn = '!t&&e.status==="pending"&&s&&r.jsx("div",{className:"pt-1 flex gap-1.5",children:r.jsx("button",{onClick:s,className:"flex-1 py-1 rounded-lg bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[9.5px] font-bold hover:bg-zinc-200 dark:hover:bg-white/15 transition-colors cursor-pointer",children:"Suggest Different Midpoint"})})';
const newSuggestBtn = `!t&&e.status==="pending"&&r.jsxs("div",{className:"pt-1.5 flex gap-1.5",children:[r.jsxs("button",{type:"button",onClick:()=>s&&s(e),className:"flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer",children:[r.jsx(dr,{className:"w-3 h-3 text-white"}),"Accept & Confirm"]}),r.jsx("button",{type:"button",onClick:()=>window.dispatchEvent(new CustomEvent("o1fc-suggest-midpoint",{detail:e})),className:"px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium hover:bg-zinc-200 dark:hover:bg-white/15 transition-colors cursor-pointer",children:"Suggest Midpoint"})]})`;

bundle = bundle.replace(oldSuggestBtn, newSuggestBtn);
console.log('8. "Accept & Confirm" button attached to Kce booking card');

// 9. Update Vce (Chat Component) with Realtime, Booking Confirmation & Session Accept Handler
const oldVce = bundle.substring(
  bundle.indexOf('Vce=({buddy:e,'),
  bundle.indexOf('qce=({buddy:e,onClose:t,onSend:a})=>{')
);

const gceCallOld = 'z?r.jsx(Vce,{buddy:z,isAccepted:pe.has(z.user_email)||B.has(z.user_email)||L.has(z.user_email),';
const gceCallNew = 'z?r.jsx(Vce,{buddy:z,currentUserEmail:effectiveUserEmail,isAccepted:pe.has(z.user_email)||B.has(z.user_email)||L.has(z.user_email),';
bundle = bundle.replace(gceCallOld, gceCallNew);

const newVceCode = `Vce=({buddy:e,currentUserEmail:uMail,isAccepted:t,onAcceptRequest:a,onPassRequest:n,onUnmatch:s,onBlock:i,onReport:o,onBack:c,showToast:d})=>{var h;const myEmail=(uMail||Pa()||"athlete@ofc.app").toLowerCase(),partnerEmail=(e.user_email||"").toLowerCase(),[p,f]=g.useState([]),[x,y]=g.useState(""),[w,v]=g.useState(!1),[N,j]=g.useState(!1),S=Oi.useRef(null),k=e.user_name.split(" ").map(z=>z[0]).join("").slice(0,2),P=(h=e.photos)!=null&&h.length?e.photos:e.avatar_url?[e.avatar_url]:[];g.useEffect(()=>{S.current&&(S.current.scrollTop=S.current.scrollHeight)},[p]);g.useEffect(()=>{let active=!0;const load=async()=>{try{const raw=await sEe(myEmail,partnerEmail);if(!active||!raw)return;const mapped=raw.map(m=>{let bObj=null,isBk=!1,txt=m.message;try{const parsed=typeof m.message==="string"&&m.message.startsWith("{")?JSON.parse(m.message):null;parsed&&(parsed.booking||parsed.type==="booking")?(isBk=!0,bObj=parsed.booking||parsed):parsed&&parsed.notification&&(txt=parsed.notification.message||m.message)}catch{}const timeStr=m.timestamp?new Date(m.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});return{id:m.id||("msg_"+Math.random()),type:isBk?"booking":"text",text:txt,booking:bObj,fromMe:(m.sender_email||"").toLowerCase()===myEmail,time:timeStr}});f(mapped)}catch(err){console.warn("[Vce] load messages error:",err)}};load();let ch=null;if(at()&&_e){try{ch=_e.channel("direct_messages_channel").on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages"},payload=>{const nr=payload.new;if(!nr)return;const sm=(nr.sender_email||"").toLowerCase(),rm=(nr.receiver_email||"").toLowerCase();if((sm===partnerEmail&&rm===myEmail)||(sm===myEmail&&rm===partnerEmail)){f(prev=>{if(prev.some(it=>it.id===nr.id))return prev;let bObj=null,isBk=!1,txt=nr.message;try{const parsed=typeof nr.message==="string"&&nr.message.startsWith("{")?JSON.parse(nr.message):null;parsed&&(parsed.booking||parsed.type==="booking")?(isBk=!0,bObj=parsed.booking||parsed):parsed&&parsed.notification&&(txt=parsed.notification.message||nr.message)}catch{}const timeStr=nr.timestamp?new Date(nr.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});return[...prev,{id:nr.id,type:isBk?"booking":"text",text:txt,booking:bObj,fromMe:sm===myEmail,time:timeStr}]})}}).subscribe()}catch(chErr){console.warn("[Vce] Realtime fallback:",chErr)}}return()=>{active=!1,ch&&_e&&_e.removeChannel(ch)}},[partnerEmail,myEmail]);const T=async z=>{if(!z.trim())return;const timeStr=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),tempId="msg_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);f(D=>[...D,{id:tempId,type:"text",text:z.trim(),fromMe:!0,time:timeStr}]),y("");try{await nEe(myEmail,partnerEmail,z.trim())}catch(err){console.warn("[Vce] nEe send error:",err)}const isDemo=e.is_demo===!0||(e.id&&String(e.id).startsWith("mock-"))||(e.user_email&&e.user_email.includes("@example.com"));if(isDemo){setTimeout(async()=>{const pool=["Sounds like a plan! Let us get after it. Looking forward to training together.","Locked in! What time are you thinking of hitting the weights?","Solid. I am focusing on high intensity this week, let us crush it.","Great connecting! See you on the gym floor."],repText=pool[Math.floor(Math.random()*pool.length)],repTime=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),repId="msg_rep_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);try{await nEe(partnerEmail,myEmail,repText)}catch{}f(D=>[...D,{id:repId,type:"text",text:repText,fromMe:!1,time:repTime}])},1500)}},A=async z=>{const timeStr=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),tempId="msg_bk_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);f(D=>[...D,{id:tempId,type:"booking",fromMe:!0,time:timeStr,booking:z}]),v(!1),d(z.isMidpoint?"Midpoint session invite sent! Awaiting partner response.":"Session invite sent! Awaiting partner response.","success");const bookingJson=JSON.stringify({type:"booking",booking:z});try{await nEe(myEmail,partnerEmail,bookingJson)}catch(err){console.warn("[Vce] booking nEe error:",err)}if(at()&&_e){try{await _e.from("gym_bookings").insert({host_id:myEmail,partner_id:partnerEmail,venue_name:z.gym,gym_address:z.gymAddress||"",scheduled_at:z.date+"T"+(z.timeSlot||"07:00:00"),is_midpoint:!!z.isMidpoint,travel_split:z.travelSplit?JSON.stringify(z.travelSplit):null,status:"pending",created_at:new Date().toISOString()})}catch(bErr){console.warn("[gym_bookings] insert error:",bErr)}}const isDemo=e.is_demo===!0||(e.id&&String(e.id).startsWith("mock-"))||(e.user_email&&e.user_email.includes("@example.com"));if(isDemo){setTimeout(async()=>{const repText="Session locked in for "+z.date+" at "+z.gym+"! Looking forward to training together.",repTime=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),repId="msg_rep_bk_"+Date.now();try{await nEe(partnerEmail,myEmail,repText)}catch{}f(D=>[...D,{id:repId,type:"text",text:repText,fromMe:!1,time:repTime}])},1500)}},handleAcceptBooking=async b=>{b.status="accepted";d("Workout session confirmed! Added to your schedule.","success");f(prev=>prev.map(m=>(m.booking&&(m.booking.gym===b.gym&&m.booking.date===b.date))?{...m,booking:{...m.booking,status:"accepted"}}:m));if(at()&&_e){try{await _e.from("gym_bookings").update({status:"confirmed"}).or("and(host_id.eq."+myEmail+",partner_id.eq."+partnerEmail+"),and(host_id.eq."+partnerEmail+",partner_id.eq."+myEmail+")")}catch(bErr){console.warn("[gym_bookings] update err:",bErr)}}const confirmMsg="Session confirmed! See you at "+b.gym+" on "+b.date+" at "+b.timeSlot+"!";await T(confirmMsg);};return r.jsxs("div",{className:"flex flex-col h-full bg-[#08080A] text-white select-none relative",children:[r.jsxs("div",{className:"flex items-center justify-between px-3 py-2.5 border-b border-white/[0.08] bg-black/40 backdrop-blur-md shrink-0",children:[r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx("button",{onClick:c,className:"p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] active:scale-95 transition-all cursor-pointer",title:"Back",children:r.jsx(Dk,{className:"w-4 h-4"})}),r.jsxs("div",{className:"relative cursor-pointer",children:[r.jsx("div",{className:"w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center font-bold text-xs text-white/70",children:P[0]?r.jsx("img",{src:P[0],alt:e.user_name,className:"w-full h-full object-cover"}):k}),Cj(e.last_active_at)&&r.jsx("span",{className:"absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#08080A]"})]}),r.jsxs("div",{children:[r.jsxs("div",{className:"flex items-center gap-1.5",children:[r.jsx("h3",{className:"text-xs font-bold text-white leading-tight",children:e.user_name}),r.jsx("span",{className:"text-[10px] text-zinc-400 font-mono",children:"· "+e.age})]}),r.jsxs("p",{className:"text-[10px] text-zinc-400 truncate max-w-[150px]",children:[e.discipline," · ",e.home_gym]})]})]}),r.jsxs("div",{className:"flex items-center gap-1",children:[r.jsxs("button",{onClick:()=>v(!0),className:"px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1 cursor-pointer",children:[r.jsx(yv,{className:"w-3 h-3"})," Book Gym"]}),r.jsx("button",{onClick:()=>j(!N),className:"p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] active:scale-95 transition-all cursor-pointer relative",children:r.jsx(bs,{className:"w-4 h-4"})})]})]}),N&&r.jsxs("div",{className:"absolute top-12 right-3 z-50 w-44 rounded-xl bg-zinc-900 border border-white/10 p-1 shadow-2xl space-y-0.5 text-[11px]",children:[r.jsxs("button",{onClick:()=>{j(!1);s()},className:"w-full text-left px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer",children:[r.jsx(Mi,{className:"w-3.5 h-3.5"})," Unmatch"]}),r.jsxs("button",{onClick:()=>{j(!1);o()},className:"w-full text-left px-2.5 py-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer",children:[r.jsx(Ss,{className:"w-3.5 h-3.5"})," Report Athlete"]}),r.jsxs("button",{onClick:()=>{j(!1);i()},className:"w-full text-left px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer",children:[r.jsx($S,{className:"w-3.5 h-3.5"})," Block Athlete"]})]}),!t&&r.jsxs("div",{className:"p-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between gap-2 shrink-0",children:[r.jsxs("div",{className:"space-y-0.5",children:[r.jsx("p",{className:"text-[11px] font-bold text-red-400",children:"Connection Pending"}),r.jsx("p",{className:"text-[10px] text-zinc-400",children:"Accept this athlete to unlock unlimited messaging."})]}),r.jsxs("div",{className:"flex items-center gap-1.5",children:[r.jsx("button",{onClick:a,className:"px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold active:scale-95 transition-all cursor-pointer",children:"Accept"}),r.jsx("button",{onClick:n,className:"px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-zinc-300 text-[10px] font-medium active:scale-95 transition-all cursor-pointer",children:"Pass"})]})]}),r.jsxs("div",{ref:S,className:"flex-1 overflow-y-auto p-3 space-y-3 min-h-0",children:[p.length===0&&r.jsxs("div",{className:"text-center py-10 space-y-2",children:[r.jsx("div",{className:"w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500",children:r.jsx($a,{className:"w-5 h-5"})}),r.jsxs("p",{className:"text-xs font-semibold text-zinc-400",children:["Start the workout conversation with ",e.user_name]}),r.jsx("p",{className:"text-[10px] text-zinc-500 max-w-xs mx-auto",children:"Coordinate gym times, discuss training disciplines, or send a venue invite."})]}),p.map(D=>D.type==="booking"?r.jsx(Kce,{key:D.id,booking:D.booking,fromMe:D.fromMe,time:D.time,buddyName:e.user_name,onSuggestAlternative:handleAcceptBooking}):r.jsxs("div",{key:D.id,className:"flex flex-col "+(D.fromMe?"items-end":"items-start"),children:[r.jsx("div",{className:"max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed break-words "+(D.fromMe?"bg-red-600 text-white rounded-br-xs":"bg-zinc-800/90 text-zinc-200 border border-white/[0.06] rounded-bl-xs"),children:D.text}),r.jsx("span",{className:"text-[9px] text-zinc-500 px-1 pt-0.5",children:D.time})]}))]}),r.jsx("div",{className:"p-2.5 bg-black/50 border-t border-white/[0.08] shrink-0",children:r.jsxs("form",{onSubmit:D=>{D.preventDefault();T(x)},className:"flex items-center gap-2",children:[r.jsx("input",{type:"text",value:x,onChange:D=>y(D.target.value),placeholder:"Message "+e.user_name+"...",className:"flex-1 py-2 px-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"}),r.jsx("button",{type:"submit",disabled:!x.trim(),className:"p-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 text-white active:scale-95 transition-all cursor-pointer shadow-md shadow-red-600/20",children:r.jsx($a,{className:"w-3.5 h-3.5"})})]})}),w&&r.jsx(qce,{buddy:e,onClose:()=>v(!1),onSend:A})]});},`;

bundle = bundle.replace(oldVce, newVceCode);
console.log('9. Vce chat patched with booking accept handler');

// 10. Visiting badge in Uce (Discover athlete card)
const oldUceBadge = 'r.jsxs("div",{className:`absolute top-2 left-2 px-1.5 py-[2px] rounded-full backdrop-blur-sm shadow-lg flex items-center gap-0.5 z-10 ${y?"bg-gradient-to-r from-emerald-500/90 to-teal-600/90 shadow-emerald-500/20":"bg-gradient-to-r from-amber-500/90 to-amber-600/90 shadow-amber-500/20"}`,children:[r.jsx(sr,{className:"w-2 h-2 text-white"}),r.jsxs("span",{className:"text-[9px] font-mono font-black text-white tracking-tight",children:[t,"%"]})]}),';
const newUceBadge = oldUceBadge + 'e.is_travel_mode&&r.jsxs("div",{className:"absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600/95 backdrop-blur-md text-white text-[9px] font-bold tracking-tight shadow-md flex items-center gap-1 z-10 border border-white/20",children:[r.jsx("span",{className:"text-[10px]",children:"✈"}),r.jsxs("span",{className:"truncate max-w-[85px]",children:["Visiting ",e.travel_city||e.travel_country||"City"]})]}),';
bundle = bundle.replace(oldUceBadge, newUceBadge);
console.log('10. Visiting badge added to Uce cards');

// 11. Visiting badge in Jce (Profile modal)
const oldJceBadge = 'r.jsxs("div",{className:`absolute top-3 left-3 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg flex items-center gap-1 z-10 ${E?"bg-gradient-to-r from-emerald-500/90 to-teal-600/90 shadow-emerald-500/20":"bg-gradient-to-r from-amber-500/90 to-amber-600/90 shadow-amber-500/20"}`,children:[r.jsx(sr,{className:"w-3 h-3 text-white"}),r.jsxs("span",{className:"text-[10px] font-mono font-black text-white",children:[s,"% Match"]})]}),';
const newJceBadge = oldJceBadge + 'e.is_travel_mode&&r.jsxs("div",{className:"absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-600/95 backdrop-blur-md text-white text-[10px] font-bold tracking-tight shadow-lg flex items-center gap-1.5 z-10 border border-white/20",children:[r.jsx("span",{children:"✈"}),r.jsxs("span",{children:["Visiting ",e.travel_city||e.travel_country||"City"]})]}),';
bundle = bundle.replace(oldJceBadge, newJceBadge);
console.log('11. Visiting badge added to Jce profile modal');

// 12. Gce State Extensions: Coords, Travel, Match Modal, and Persona Switcher State
const oldCoordsStr = 'o=-33.8688,c=151.2093,';
const newCoordsStr = `[travelActive,setTravelActive]=g.useState(()=>{try{const tm=localStorage.getItem("o1fc_travel_mode");return tm?JSON.parse(tm):null}catch{return null}}),[o,setO]=g.useState(()=>{try{const tm=localStorage.getItem("o1fc_travel_mode");if(tm){const p=JSON.parse(tm);if(p.is_travel_mode&&typeof p.travel_latitude==="number")return p.travel_latitude}}catch{}return -33.8688}),[c,setC]=g.useState(()=>{try{const tm=localStorage.getItem("o1fc_travel_mode");if(tm){const p=JSON.parse(tm);if(p.is_travel_mode&&typeof p.travel_longitude==="number")return p.travel_longitude}}catch{}return 151.2093}),[matchModalAthlete,setMatchModalAthlete]=g.useState(null),[activePersona,setActivePersona]=g.useState(null),effectiveUserEmail=activePersona?activePersona.email:(a||"athlete@ofc.app"),`;
bundle = bundle.replace(oldCoordsStr, newCoordsStr);
console.log('12. Gce coords, travel, and persona switcher states attached');

// 13. Gce GPS Capture and Travel Mode Listener Effect
const oldEffectEnd = '[W.is_ghost_mode,W.gym_zone_sharing,W.public_telemetry,W.show_weight]);';
const newGpsEffect = `[W.is_ghost_mode,W.gym_zone_sharing,W.public_telemetry,W.show_weight]);g.useEffect(()=>{if(!e||activePersona)return;const tmRaw=localStorage.getItem("o1fc_travel_mode");let inTravel=!1;if(tmRaw){try{const parsed=JSON.parse(tmRaw);if(parsed.is_travel_mode&&typeof parsed.travel_latitude==="number"){inTravel=!0,setTravelActive(parsed),setO(parsed.travel_latitude),setC(parsed.travel_longitude)}}catch{}}if(!inTravel&&typeof navigator!=="undefined"&&navigator.geolocation){navigator.geolocation.getCurrentPosition(pos=>{const{latitude:lat,longitude:lng}=pos.coords;setO(lat),setC(lng);if(at()&&_e&&effectiveUserEmail){try{_e.from("buddy_profiles").upsert({user_email:effectiveUserEmail.toLowerCase(),user_name:W.display_name||"Athlete",handle:W.username||"athlete",avatar_url:W.avatar_url||"",photos:W.photos||(W.avatar_url?[W.avatar_url]:[]),age:W.age||26,height:W.height_cm||178,weight:W.weight_kg||75,show_weight:W.show_weight??!0,training_focus:W.primary_focus||"Hypertrophy",discipline:W.primary_focus||"Hypertrophy",experience_level:"Intermediate",preferred_time:"Evening (4-7 PM)",home_gym:W.home_gym||"Iron Works",current_gym:W.home_gym||"Iron Works",gym_zone_sharing:W.gym_zone_sharing??!0,public_telemetry:W.public_telemetry??!0,is_ghost_mode:W.is_ghost_mode??!1,latitude:lat,longitude:lng,last_active_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"user_email"}).then(()=>{},()=>{})}catch{}}},()=>{if(at()&&_e&&effectiveUserEmail){try{_e.from("buddy_profiles").upsert({user_email:effectiveUserEmail.toLowerCase(),user_name:W.display_name||"Athlete",handle:W.username||"athlete",avatar_url:W.avatar_url||"",photos:W.photos||(W.avatar_url?[W.avatar_url]:[]),age:W.age||26,height:W.height_cm||178,weight:W.weight_kg||75,show_weight:W.show_weight??!0,training_focus:W.primary_focus||"Hypertrophy",discipline:W.primary_focus||"Hypertrophy",experience_level:"Intermediate",preferred_time:"Evening (4-7 PM)",home_gym:W.home_gym||"Iron Works",current_gym:W.home_gym||"Iron Works",gym_zone_sharing:W.gym_zone_sharing??!0,public_telemetry:W.public_telemetry??!0,is_ghost_mode:W.is_ghost_mode??!1,latitude:o,longitude:c,last_active_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"user_email"}).then(()=>{},()=>{})}catch{}}},{timeout:5000,enableHighAccuracy:!1})}},[e,effectiveUserEmail,W,activePersona]);g.useEffect(()=>{const onTravel=ev=>{const d=ev.detail;if(d&&d.is_travel_mode&&typeof d.travel_latitude==="number"){setTravelActive(d);setO(d.travel_latitude);setC(d.travel_longitude);Ce(!0)}else{setTravelActive(null);if(typeof navigator!=="undefined"&&navigator.geolocation){navigator.geolocation.getCurrentPosition(pos=>{setO(pos.coords.latitude);setC(pos.coords.longitude);Ce(!0)},()=>{})}}};window.addEventListener("o1fc-travel-mode-updated",onTravel);return()=>window.removeEventListener("o1fc-travel-mode-updated",onTravel)},[]);`;
bundle = bundle.replace(oldEffectEnd, newGpsEffect);
console.log('13. Gce GPS & travel effect attached');

// 14. Travel Mode button in Discover Header
const oldDiscoverHeaderButtons = 'd==="discover"&&r.jsxs(r.Fragment,{children:[';
const newDiscoverHeaderButtons = oldDiscoverHeaderButtons + 'r.jsxs("button",{onClick:()=>window.dispatchEvent(new CustomEvent("open_travel_pass")),className:`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer mr-1 transition-all ${travelActive?.is_travel_mode?"bg-red-600/25 text-red-400 border border-red-500/40 shadow-xs":"bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"}`,title:travelActive?.is_travel_mode?`Travel Mode: ${travelActive.travel_city}`:"Travel Hub / Passport",children:[r.jsx("span",{children:"✈"}),r.jsx("span",{className:"truncate max-w-[65px]",children:travelActive?.is_travel_mode?(travelActive.travel_city||"Traveling"):"Travel"})]}),';
bundle = bundle.replace(oldDiscoverHeaderButtons, newDiscoverHeaderButtons);
console.log('14. Travel button added to Discover header');

// 15. Active Persona Switcher toolbar + Travel Banner in Discover View
const oldWceRender = 'd==="discover"?r.jsx(Wce,';
const newWceRender = `d==="discover"?r.jsxs(r.Fragment,{children:[r.jsxs("div",{className:"mx-2.5 md:mx-3 mb-2 p-2 rounded-2xl bg-zinc-900/90 dark:bg-[#12141A]/95 border border-zinc-700/60 dark:border-zinc-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-md",children:[r.jsxs("div",{className:"flex items-center gap-1.5",children:[r.jsx("div",{className:"w-2 h-2 rounded-full bg-emerald-500 animate-pulse"}),r.jsx("span",{className:"text-[9.5px] font-mono font-bold text-zinc-300 uppercase tracking-wider",children:"Test Persona Switcher"}),activePersona&&r.jsxs("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30",children:["Active: ",activePersona.name]})]}),r.jsxs("div",{className:"flex items-center gap-1",children:[r.jsxs("button",{type:"button",onClick:()=>{const p={id:"alex",name:"Alex Torres",email:"alex.test@o1fc.app",gender:"male",discipline:"Hypertrophy",city:"Melbourne",lat:-37.8136,lng:144.9631,avatar_url:"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"};setActivePersona(p);setO(p.lat);setC(p.lng);R(null);k(null);n("Switched test persona to Alex Torres (Melbourne · Local)","success");Ce(!0);},className:\`px-2 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 \${activePersona?.id==="alex"?"bg-red-600 text-white shadow-xs":"bg-zinc-800 text-zinc-300 hover:text-white"}\`,children:[r.jsx("span",{children:"👤"}),"Alex (Local)"]}),r.jsxs("button",{type:"button",onClick:()=>{const p={id:"elena",name:"Elena Rostova",email:"elena.test@o1fc.app",gender:"female",discipline:"Hyrox & Pilates",city:"London",lat:51.5074,lng:-0.1278,is_travel_mode:!0,travel_city:"London",avatar_url:"https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"};setActivePersona(p);setO(p.lat);setC(p.lng);R(null);k(null);n("Switched test persona to Elena Rostova (London · Visiting)","success");Ce(!0);},className:\`px-2 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 \${activePersona?.id==="elena"?"bg-red-600 text-white shadow-xs":"bg-zinc-800 text-zinc-300 hover:text-white"}\`,children:[r.jsx("span",{children:"✈"}),"Elena (Visiting)"]}),r.jsxs("button",{type:"button",onClick:()=>{setActivePersona(null);R(null);k(null);n("Reverted to Authenticated Account","info");Ce(!0);},className:\`px-2 py-1 rounded-lg text-[10px] font-medium transition-all active:scale-95 cursor-pointer \${!activePersona?"bg-zinc-700 text-white font-bold":"bg-transparent text-zinc-400 hover:text-white"}\`,children:[r.jsx("span",{children:"🔄"}),"My Profile"]})]})]}),travelActive?.is_travel_mode&&r.jsxs("div",{className:"mx-2.5 md:mx-3 mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-red-600/20 via-red-950/40 to-zinc-900 border border-red-500/35 flex items-center justify-between gap-2 shadow-sm",children:[r.jsxs("div",{className:"flex items-center gap-2.5 min-w-0",children:[r.jsx("div",{className:"w-7 h-7 rounded-xl bg-red-600/30 text-white flex items-center justify-center font-bold text-xs shrink-0",children:"✈"}),r.jsxs("div",{className:"min-w-0",children:[r.jsxs("p",{className:"text-[11px] font-bold text-white truncate",children:["Visiting ",travelActive.travel_city,travelActive.travel_country?", "+travelActive.travel_country:""]}),r.jsx("p",{className:"text-[9px] text-zinc-400 leading-tight",children:"Discover radar centered at your travel destination"})]})]}),r.jsx("button",{onClick:async()=>{if(at()&&_e&&effectiveUserEmail){try{await _e.from("buddy_profiles").update({is_travel_mode:!1}).eq("user_email",effectiveUserEmail.toLowerCase())}catch{}}localStorage.removeItem("o1fc_travel_mode");window.dispatchEvent(new CustomEvent("o1fc-travel-mode-updated",{detail:{is_travel_mode:!1}}));n("Travel Mode deactivated. Returned to live GPS.","info")},className:"px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold shrink-0 transition-colors cursor-pointer border border-white/10",children:"Reset GPS"})]}),r.jsx(Wce,`;

bundle = bundle.replace(oldWceRender, newWceRender);
bundle = bundle.replace('onOpenPayPlan:s}):d==="matched"', 'onOpenPayPlan:s})]}):d==="matched"');
console.log('15. Persona switcher & travel banner attached to Discover screen');

// 16. Swiping and Mutual Matching Logic with Reciprocal Detection & Celebration
const oldAtBlock = 'At=je=>{j2(a,je.user_email,"like"),V(Re=>{const Pe=new Set(Re);return Pe.has(je.user_email)?(Pe.delete(je.user_email),n(`Removed like for ${je.user_name}`)):(Pe.add(je.user_email),n(`Liked ${je.user_name}`,"success")),Pe})},ke=je=>{j2(a,je.user_email,"like"),L(Re=>new Set([...Re,je.user_email])),V(Re=>new Set([...Re,je.user_email])),n(`Connection request accepted! You can now chat freely with ${je.user_name}.`,"success")},xe=je=>{j2(a,je.user_email,"pass"),K(Re=>new Set([...Re,je.user_email])),(z==null?void 0:z.user_email)===je.user_email&&R(null),(S==null?void 0:S.user_email)===je.user_email&&k(null),n(`Declined request from ${je.user_name}`,"success")},';

const newAtBlock = `At=async je=>{
  await j2(effectiveUserEmail,je.user_email,"like");
  V(Re=>{const Pe=new Set(Re);return Pe.has(je.user_email)?(Pe.delete(je.user_email),n("Removed like for "+je.user_name)):(Pe.add(je.user_email),Pe)});
  let isReciprocal=false;
  try{
    if(globalThis.__o1fc_swipes){
      isReciprocal=globalThis.__o1fc_swipes.has(je.user_email.toLowerCase()+"->"+effectiveUserEmail.toLowerCase()+":like");
    }
  }catch{}
  if(!isReciprocal&&at()&&_e){
    try{
      const{data:swData}=await _e.from("buddy_swipes").select("*").eq("user_id",je.user_email.toLowerCase()).eq("target_id",effectiveUserEmail.toLowerCase()).in("action",["like","fist_bump"]).limit(1);
      swData&&swData.length>0&&(isReciprocal=true);
    }catch(swErr){}
  }
  const isDemo=je.is_demo===!0||(je.id&&String(je.id).startsWith("mock-"))||(je.user_email&&je.user_email.includes("@example.com"));
  if(isReciprocal||(isDemo&&!activePersona)){
    if(at()&&_e){
      try{await _e.from("buddy_matches").insert({user1_id:effectiveUserEmail.toLowerCase(),user2_id:je.user_email.toLowerCase(),match_score:Sh(je)||95,status:"active",created_at:new Date().toISOString()})}catch(mErr){}
    }
    L(Re=>new Set([...Re,je.user_email]));
    V(Re=>new Set([...Re,je.user_email]));
    setMatchModalAthlete(je);
  }else{
    n("Liked "+je.user_name+"! Switch personas or await their swipe to match.","success");
  }
},ke=async je=>{
  await j2(effectiveUserEmail,je.user_email,"like");
  if(at()&&_e){
    try{await _e.from("buddy_matches").insert({user1_id:effectiveUserEmail.toLowerCase(),user2_id:je.user_email.toLowerCase(),match_score:Sh(je)||92,status:"active",created_at:new Date().toISOString()})}catch(mErr){}
  }
  L(Re=>new Set([...Re,je.user_email]));
  V(Re=>new Set([...Re,je.user_email]));
  setMatchModalAthlete(je);
},xe=async je=>{
  await j2(effectiveUserEmail,je.user_email,"pass");
  K(Re=>new Set([...Re,je.user_email]));
  (z==null?void 0:z.user_email)===je.user_email&&R(null);
  (S==null?void 0:S.user_email)===je.user_email&&k(null);
  n("Passed on "+je.user_name);
},`;

bundle = bundle.replace(oldAtBlock, newAtBlock);
console.log('16. Swiping, reciprocal matching and mutual trigger logic updated');

// 17. Match Celebration Modal in Gce
const oldBlockEnd = 'Submit & Block"]})]})]})})';
const newModalJSX = `,matchModalAthlete&&r.jsx("div",{className:"fixed inset-0 z-[10001] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200",children:r.jsxs("div",{className:"w-full max-w-sm rounded-3xl bg-[#0E1015] border border-red-500/40 p-6 text-center shadow-2xl space-y-5 relative overflow-hidden",children:[r.jsx("div",{className:"absolute -top-20 -left-20 w-44 h-44 bg-red-600/20 rounded-full blur-3xl pointer-events-none"}),r.jsx("div",{className:"absolute -bottom-20 -right-20 w-44 h-44 bg-red-600/20 rounded-full blur-3xl pointer-events-none"}),r.jsxs("div",{className:"inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold uppercase tracking-widest",children:[r.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"}),"Mutual Athletic Match"]}),r.jsxs("div",{className:"space-y-1",children:[r.jsx("h2",{className:"text-2xl font-black text-white tracking-tight",children:"IT'\''S A MATCH!"}),r.jsxs("p",{className:"text-xs text-zinc-400",children:["You and ",r.jsx("strong",{className:"text-white font-bold",children:matchModalAthlete.user_name})," are mutually connected!"]})]}),r.jsxs("div",{className:"flex items-center justify-center gap-3 pt-2",children:[r.jsx("div",{className:"w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-700 bg-zinc-800 shadow-lg shrink-0",children:(activePersona?.avatar_url||W.avatar_url||(W.photos&&W.photos[0]))?r.jsx("img",{src:activePersona?.avatar_url||W.avatar_url||W.photos[0],alt:"You",className:"w-full h-full object-cover"}):r.jsx("div",{className:"w-full h-full flex items-center justify-center text-white/60 font-bold text-sm",children:activePersona?activePersona.name.slice(0,2):"YOU"})}),r.jsx("div",{className:"w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 shrink-0",children:r.jsx(ma,{className:"w-5 h-5"})}),r.jsx("div",{className:"w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-500 bg-zinc-800 shadow-lg shrink-0",children:((matchModalAthlete.photos&&matchModalAthlete.photos[0])||matchModalAthlete.avatar_url)?r.jsx("img",{src:matchModalAthlete.photos?.[0]||matchModalAthlete.avatar_url,alt:matchModalAthlete.user_name,className:"w-full h-full object-cover"}):r.jsx("div",{className:"w-full h-full flex items-center justify-center text-white/60 font-bold text-sm",children:matchModalAthlete.user_name.slice(0,2).toUpperCase()})})]}),r.jsxs("div",{className:"py-1.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] inline-flex items-center gap-2 text-[11px] text-zinc-300",children:[r.jsxs("span",{className:"font-bold text-red-400 font-mono",children:[Sh(matchModalAthlete),"% COMPATIBILITY"]}),r.jsx("span",{className:"text-zinc-500",children:"·"}),r.jsx("span",{className:"truncate",children:matchModalAthlete.discipline})]}),r.jsxs("div",{className:"space-y-2 pt-1",children:[r.jsxs("button",{onClick:()=>{const target=matchModalAthlete;setMatchModalAthlete(null);k(null);R(target);},className:"w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2",children:[r.jsx($a,{className:"w-4 h-4"}),"Send Direct Message Now"]}),r.jsx("button",{onClick:()=>setMatchModalAthlete(null),className:"w-full py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer",children:"Keep Swiping"})]})]})})`;
bundle = bundle.replace(oldBlockEnd, oldBlockEnd + newModalJSX);
console.log('17. Match celebration modal attached to JSX');

// 18. Global window listener for open_travel_pass
const oldPayPlanListener = 'window.addEventListener("open_pay_plan",be),window.addEventListener("open_pay_plan_coach",be),';
const newPayPlanListener = oldPayPlanListener + 'window.addEventListener("open_travel_pass",()=>j(!0)),';
const oldPayPlanClean = 'window.removeEventListener("open_pay_plan",be),window.removeEventListener("open_pay_plan_coach",be)';
const newPayPlanClean = oldPayPlanClean + ',window.removeEventListener("open_travel_pass",()=>j(!0))';
bundle = bundle.replace(oldPayPlanListener, newPayPlanListener);
bundle = bundle.replace(oldPayPlanClean, newPayPlanClean);
console.log('18. Global open_travel_pass event listener registered');

// Validate syntax with esbuild BEFORE writing to file!
console.log('Validating bundle syntax with esbuild...');
esbuild.transformSync(bundle, { loader: 'js' });
console.log('Bundle syntax is 100% verified and valid!');

fs.writeFileSync(bundlePath, bundle, 'utf8');
console.log('Successfully written to', bundlePath, 'Final length:', bundle.length);

if (fs.existsSync('dist/assets/index-BWUawsaP.js')) {
  fs.writeFileSync('dist/assets/index-BWUawsaP.js', bundle, 'utf8');
  console.log('Successfully written to dist/assets/index-BWUawsaP.js');
}
