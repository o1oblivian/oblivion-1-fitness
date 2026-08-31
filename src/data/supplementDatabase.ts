export type SupplementTiming =
  | 'morning'
  | 'pre-workout'
  | 'intra-workout'
  | 'post-workout'
  | 'afternoon'
  | 'evening'
  | 'bedtime';

export interface CatalogSupplement {
  name: string;
  brand: string;
  dose: string;
  timing: SupplementTiming;
  category: string;
  aliases?: string[];
}

export const SUPPLEMENT_DATABASE: CatalogSupplement[] = [
  // ── EVOGEN NUTRITION ──
  { name: 'EVP-3D Non-Stim Pre-Workout', brand: 'Evogen', dose: '1 Scoop (20g)', timing: 'pre-workout', category: 'Pump & Nitric Oxide', aliases: ['preworkout', 'pump', 'arginine', 'citrulline', 'evp'] },
  { name: 'EVP Xtreme N.O. High Stim Pre-Workout', brand: 'Evogen', dose: '1 Scoop (22g)', timing: 'pre-workout', category: 'Energy & Focus Pre-Workout', aliases: ['preworkout', 'caffeine', 'energy', 'evp xtreme'] },
  { name: 'IsoJect Pure Whey Protein Isolate', brand: 'Evogen', dose: '1 Scoop (25g Protein)', timing: 'post-workout', category: 'Whey Protein Isolate', aliases: ['whey', 'protein', 'isoject', 'protien'] },
  { name: 'AminoJect BCAA / EAA Recovery', brand: 'Evogen', dose: '1 Scoop (15g)', timing: 'intra-workout', category: 'Intra-Workout Amino Acids', aliases: ['bcaa', 'eaa', 'recovery', 'aminoject'] },
  { name: 'Cell K.E.M. PR Mass & Recovery Catalyst', brand: 'Evogen', dose: '1 Scoop (16g)', timing: 'post-workout', category: 'Muscle Builder & Recovery', aliases: ['creatine', 'cell kem', 'glutamine'] },
  { name: 'Carnigen Elite L-Carnitine Matrix', brand: 'Evogen', dose: '1 Scoop (1.5g)', timing: 'morning', category: 'Metabolism & Fat Oxidation', aliases: ['carnitine', 'fat burner', 'carnigen'] },
  { name: 'Lipocide IR Metabolic Igniter', brand: 'Evogen', dose: '1 Scoop', timing: 'morning', category: 'Thermogenic Fat Burner', aliases: ['fat burner', 'thermogenic', 'lipocide'] },
  { name: 'Evolog Nutrient Partitioning & Digestion', brand: 'Evogen', dose: '1 Capsule with carbs', timing: 'afternoon', category: 'GDA & Digestive Matrix', aliases: ['gda', 'enzymes', 'insulin'] },

  // ── REVIVE MD ──
  { name: 'Liver Support (NAC + TUDCA + Milk Thistle)', brand: 'Revive', dose: '4 Capsules', timing: 'morning', category: 'Organ & Liver Health', aliases: ['liver', 'tudca', 'nac', 'revive md', 'organ'] },
  { name: 'Kidney Support (Astragalus + NAC)', brand: 'Revive', dose: '4 Capsules', timing: 'morning', category: 'Renal & Kidney Health', aliases: ['kidney', 'astragalus', 'revive md'] },
  { name: 'Heart Support (CoQ10 + Garlic + Hawthorn)', brand: 'Revive', dose: '3 Capsules', timing: 'evening', category: 'Cardiovascular Health', aliases: ['heart', 'coq10', 'blood pressure', 'revive md'] },
  { name: 'Blood Pressure RX', brand: 'Revive', dose: '4 Capsules', timing: 'morning', category: 'Cardiovascular Support', aliases: ['blood pressure', 'cardio', 'revive md'] },
  { name: 'Digest Aid Full Spectrum Enzymes', brand: 'Revive', dose: '1-2 Capsules with meals', timing: 'afternoon', category: 'Digestive Enzymes', aliases: ['gut', 'digestion', 'enzymes', 'revive md'] },
  { name: 'Daily Greens & Superfoods', brand: 'Revive', dose: '1 Scoop (10g)', timing: 'morning', category: 'Micronutrient & Immunity', aliases: ['greens', 'superfoods', 'immunity', 'revive md'] },
  { name: 'Bergamot (Cholesterol & Lipid Optimizer)', brand: 'Revive', dose: '2 Capsules (1000mg)', timing: 'evening', category: 'Lipid & Cholesterol Control', aliases: ['bergamot', 'cholesterol', 'lipids', 'revive md'] },
  { name: 'KSM-66 Ashwagandha Stress & Cortisol', brand: 'Revive', dose: '2 Capsules (600mg)', timing: 'bedtime', category: 'Cortisol & Recovery', aliases: ['ashwagandha', 'ksm66', 'stress', 'revive md'] },
  { name: 'Magnesium Glycinate Complex', brand: 'Revive', dose: '2 Capsules (400mg)', timing: 'bedtime', category: 'Neuromuscular & Sleep', aliases: ['magnesium', 'sleep', 'recovery', 'revive md'] },

  // ── MUSCLE NATION ──
  { name: '100% Whey Isolate Protein', brand: 'Muscle Nation', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Whey Protein Isolate', aliases: ['protein', 'whey', 'isolate', 'muscle nation protein', 'protien'] },
  { name: 'Destiny Fat Burner', brand: 'Muscle Nation', dose: '1 Scoop', timing: 'morning', category: 'Thermogenic Energy', aliases: ['fat burner', 'energy', 'destiny', 'caffeine'] },
  { name: 'Three-D Pump Non-Stim Pre-Workout', brand: 'Muscle Nation', dose: '1 Scoop', timing: 'pre-workout', category: 'Pump & Nitric Oxide', aliases: ['pump', 'preworkout', 'threed', 'nitric oxide'] },
  { name: 'Legacy High-Stim Pre-Workout', brand: 'Muscle Nation', dose: '1 Scoop', timing: 'pre-workout', category: 'High Energy Pre-Workout', aliases: ['preworkout', 'legacy', 'stim', 'focus'] },
  { name: 'Creatine Monohydrate 100% Pure', brand: 'Muscle Nation', dose: '5g', timing: 'post-workout', category: 'Strength & Power', aliases: ['creatine', 'strength', 'muscle builder'] },
  { name: 'Daily AM Aminos (BCAAs + Electrolytes)', brand: 'Muscle Nation', dose: '1 Scoop (10g)', timing: 'intra-workout', category: 'Hydration & Recovery', aliases: ['bcaa', 'aminos', 'hydration'] },
  { name: 'Custard Plant & Casein Protein', brand: 'Muscle Nation', dose: '2 Scoops (40g)', timing: 'bedtime', category: 'Slow-Release Protein', aliases: ['casein', 'custard', 'protein', 'dessert'] },

  // ── MYPROTEIN ──
  { name: 'Impact Whey Protein Isolate', brand: 'Myprotein', dose: '1 Scoop (25g)', timing: 'post-workout', category: 'Whey Protein Isolate', aliases: ['myprotein', 'my protein', 'protien', 'whey', 'impact whey'] },
  { name: 'Impact Whey Protein Concentrate', brand: 'Myprotein', dose: '1 Scoop (25g)', timing: 'post-workout', category: 'Whey Protein', aliases: ['myprotein', 'my protein', 'protien', 'whey'] },
  { name: 'Clear Whey Isolate', brand: 'Myprotein', dose: '1 Scoop (25g)', timing: 'post-workout', category: 'Clear Protein Drink', aliases: ['clear whey', 'myprotein', 'my protein', 'juice protein'] },
  { name: 'Creatine Monohydrate (Creapure)', brand: 'Myprotein', dose: '5g (1 Scoop)', timing: 'post-workout', category: 'Strength & Power', aliases: ['creatine', 'creapure', 'myprotein', 'my protein'] },
  { name: 'THE Pre-Workout High Caffeine', brand: 'Myprotein', dose: '1 Scoop (14g)', timing: 'pre-workout', category: 'Energy & Performance', aliases: ['preworkout', 'the pre', 'myprotein'] },
  { name: 'Essential EAA (Essential Amino Acids)', brand: 'Myprotein', dose: '2 Scoops (7g)', timing: 'intra-workout', category: 'Amino Acid Matrix', aliases: ['eaa', 'bcaa', 'recovery', 'myprotein'] },
  { name: 'Micellar Casein Slow Release', brand: 'Myprotein', dose: '1 Scoop (30g)', timing: 'bedtime', category: 'Nighttime Protein', aliases: ['casein', 'protein', 'night', 'myprotein'] },
  { name: 'Alpha Men Multivitamin Elite', brand: 'Myprotein', dose: '2 Tablets', timing: 'morning', category: 'Multivitamin & Minerals', aliases: ['multivitamin', 'vitamins', 'alpha men', 'myprotein'] },

  // ── THORNE ──
  { name: 'Creatine Monohydrate NSF Certified', brand: 'Thorne', dose: '5g (1 Scoop)', timing: 'post-workout', category: 'ATP & Muscle Power', aliases: ['creatine', 'thorne creatine', 'monohydrate', 'atp'] },
  { name: 'Basic Nutrients 2/Day Multivitamin', brand: 'Thorne', dose: '2 Capsules', timing: 'morning', category: 'Foundational Micronutrients', aliases: ['multivitamin', 'vitamins', 'thorne multi', 'zinc'] },
  { name: 'Super EPA Pro High Potency Fish Oil', brand: 'Thorne', dose: '2 Softgels (1300mg EPA/DHA)', timing: 'morning', category: 'Cardiovascular & Joint', aliases: ['omega 3', 'fish oil', 'epa', 'dha'] },
  { name: 'Magnesium Bisglycinate Powder', brand: 'Thorne', dose: '1 Scoop (200mg)', timing: 'bedtime', category: 'Sleep & Nervous System', aliases: ['magnesium', 'glycinate', 'sleep', 'cramps'] },
  { name: 'Vitamin D3 / K2 Liquid Drops', brand: 'Thorne', dose: '2 Drops (2000 IU D3 / 400mcg K2)', timing: 'morning', category: 'Bone & Hormonal Health', aliases: ['vitamin d', 'd3', 'k2', 'immunity', 'sunshine'] },
  { name: 'Amino Complex (Essential Amino Acids)', brand: 'Thorne', dose: '1 Scoop (7.5g)', timing: 'intra-workout', category: 'Muscle Protein Synthesis', aliases: ['eaa', 'bcaa', 'aminos', 'thorne'] },
  { name: 'Berberine Dual-Action Glucose Support', brand: 'Thorne', dose: '2 Capsules (1000mg)', timing: 'afternoon', category: 'Metabolic & Insulin Sensitivity', aliases: ['berberine', 'gda', 'glucose', 'insulin'] },
  { name: 'Curcumin Phytosome (Meriva)', brand: 'Thorne', dose: '2 Capsules (1000mg)', timing: 'evening', category: 'Anti-Inflammatory & Joints', aliases: ['curcumin', 'turmeric', 'joints', 'inflammation'] },
  { name: 'Whey Protein Isolate NSF', brand: 'Thorne', dose: '1 Scoop (21g Protein)', timing: 'post-workout', category: 'Whey Protein Isolate', aliases: ['whey', 'protein', 'thorne protein', 'protien'] },

  // ── OPTIMUM NUTRITION (ON) ──
  { name: 'Gold Standard 100% Whey Protein', brand: 'Optimum Nutrition', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Whey Protein Blend', aliases: ['gold standard', 'whey', 'protein', 'on protein', 'protien'] },
  { name: 'Gold Standard 100% Isolate', brand: 'Optimum Nutrition', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Whey Isolate', aliases: ['isolate', 'gold standard isolate', 'protein'] },
  { name: 'Micellar Casein 100% Gold Standard', brand: 'Optimum Nutrition', dose: '1 Scoop (34g)', timing: 'bedtime', category: 'Slow Digesting Protein', aliases: ['casein', 'protein', 'nighttime'] },
  { name: 'Micronized Creatine Powder', brand: 'Optimum Nutrition', dose: '5g (1 Teaspoon)', timing: 'post-workout', category: 'Strength & Cellular Energy', aliases: ['creatine', 'on creatine', 'strength'] },
  { name: 'Essential Amino Energy + Caffeine', brand: 'Optimum Nutrition', dose: '2 Scoops (9g)', timing: 'pre-workout', category: 'Energy & Amino Acids', aliases: ['amino energy', 'energy', 'bcaa', 'caffeine'] },
  { name: 'Opti-Men High Potency Multivitamin', brand: 'Optimum Nutrition', dose: '3 Tablets', timing: 'morning', category: 'Performance Micronutrients', aliases: ['opti-men', 'multivitamin', 'optimen', 'vitamins'] },
  { name: 'Opti-Women Active Multivitamin', brand: 'Optimum Nutrition', dose: '2 Capsules', timing: 'morning', category: 'Women Micronutrients', aliases: ['opti-women', 'multivitamin', 'optiwomen'] },
  { name: 'Serious Mass High Calorie Gainer', brand: 'Optimum Nutrition', dose: '2 Scoops (334g)', timing: 'post-workout', category: 'Mass Gainer & Carbohydrates', aliases: ['mass gainer', 'serious mass', 'weight gainer', 'carbs'] },

  // ── GORILLA MIND ──
  { name: 'Gorilla Mode Pre-Workout (Max N.O. & Energy)', brand: 'Gorilla Mind', dose: '1-2 Scoops', timing: 'pre-workout', category: 'High-Performance Pre-Workout', aliases: ['gorilla mode', 'preworkout', 'derek', 'pump', 'energy'] },
  { name: 'Gorilla Mode Nitric (Non-Stim Mega Pump)', brand: 'Gorilla Mind', dose: '1-2 Scoops', timing: 'pre-workout', category: 'Non-Stim Nitric Oxide Pump', aliases: ['gorilla nitric', 'nitric', 'pump', 'non-stim'] },
  { name: 'Gorilla Mind Smooth (Nootropic Focus)', brand: 'Gorilla Mind', dose: '3-6 Capsules', timing: 'morning', category: 'Cognitive Drive & Memory', aliases: ['smooth', 'nootropic', 'focus', 'brain'] },
  { name: 'Gorilla Mode Glycerol Liquid Pump', brand: 'Gorilla Mind', dose: '1-2 Tbsp', timing: 'pre-workout', category: 'Hyper-Hydration Pump', aliases: ['glycerol', 'hydroprime', 'pump'] },
  { name: 'Sigma Testosterone Support Complex', brand: 'Gorilla Mind', dose: '2-4 Capsules', timing: 'morning', category: 'Natural Hormone Support', aliases: ['sigma', 'testosterone', 'tongkat', 'fadogia'] },
  { name: 'Gorilla Mode Premium Protein', brand: 'Gorilla Mind', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Whey Protein Blend', aliases: ['gorilla protein', 'whey', 'protein'] },
  { name: 'Gorilla Dream Sleep & Recovery', brand: 'Gorilla Mind', dose: '4 Capsules', timing: 'bedtime', category: 'Deep Sleep & GH Support', aliases: ['gorilla dream', 'sleep', 'gaba', 'melatonin'] },

  // ── TRANSPARENT LABS ──
  { name: 'BULK Pre-Workout (Clinically Dosed)', brand: 'Transparent Labs', dose: '1 Scoop (23g)', timing: 'pre-workout', category: 'Test & Power Pre-Workout', aliases: ['bulk preworkout', 'tl bulk', 'citrulline'] },
  { name: 'LEAN Pre-Workout (Thermogenic)', brand: 'Transparent Labs', dose: '1 Scoop (16g)', timing: 'pre-workout', category: 'Cutting Pre-Workout', aliases: ['lean preworkout', 'fat burner pre'] },
  { name: '100% Grass-Fed Whey Isolate', brand: 'Transparent Labs', dose: '1 Scoop (28g)', timing: 'post-workout', category: 'Grass-Fed Whey Isolate', aliases: ['grass fed', 'whey isolate', 'protein', 'tl protein'] },
  { name: 'Creatine HMB Muscle Preserver', brand: 'Transparent Labs', dose: '1 Scoop (7g)', timing: 'post-workout', category: 'Strength & Anti-Catabolic', aliases: ['creatine hmb', 'hmb', 'creapure'] },
  { name: 'BCAA Glutamine Recovery Fuel', brand: 'Transparent Labs', dose: '1 Scoop (14g)', timing: 'intra-workout', category: 'BCAA & Glutamine Matrix', aliases: ['bcaa', 'glutamine', 'intra'] },

  // ── GHOST LIFESTYLE ──
  { name: 'GHOST Legend Pre-Workout V3', brand: 'Ghost', dose: '1-2 Scoops', timing: 'pre-workout', category: 'High Energy & Focus Pre', aliases: ['ghost legend', 'legend', 'preworkout', 'caffeine'] },
  { name: 'GHOST Pump V2 (Nitric Oxide)', brand: 'Ghost', dose: '1-2 Scoops', timing: 'pre-workout', category: 'Non-Stimulant Pump', aliases: ['ghost pump', 'pump', 'nitric oxide'] },
  { name: 'GHOST Whey 100% Protein (Chips Ahoy / Oreo)', brand: 'Ghost', dose: '1 Scoop (34g)', timing: 'post-workout', category: 'Whey Protein Blend', aliases: ['ghost whey', 'protein', 'oreo', 'chips ahoy'] },
  { name: 'GHOST Size Muscle Builder (Creapure + Betaine)', brand: 'Ghost', dose: '1 Scoop (11g)', timing: 'post-workout', category: 'Daily Muscle Volumizer', aliases: ['ghost size', 'creatine', 'betaine', 'size'] },
  { name: 'GHOST Amino EAA + BCAA', brand: 'Ghost', dose: '1 Scoop (10g)', timing: 'intra-workout', category: 'Electrolytes & Aminos', aliases: ['ghost amino', 'eaa', 'bcaa', 'hydration'] },
  { name: 'GHOST Burn Thermogenic Fat Burner', brand: 'Ghost', dose: '1-2 Scoops', timing: 'morning', category: 'Thermogenic & Carnitine', aliases: ['ghost burn', 'fat burner', 'burn', 'carnitine'] },

  // ── RAW NUTRITION & CBUM ──
  { name: 'CBUM Thavage Pre-Workout', brand: 'Raw Nutrition', dose: '1-2 Scoops', timing: 'pre-workout', category: 'Comprehensive Pre-Workout', aliases: ['thavage', 'cbum', 'preworkout', 'chris bumstead'] },
  { name: 'CBUM Itholate 100% Grass Fed Isolate', brand: 'Raw Nutrition', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Whey Protein Isolate', aliases: ['itholate', 'cbum protein', 'isolate', 'whey'] },
  { name: 'Raw Pump Non-Stim Pre', brand: 'Raw Nutrition', dose: '1-2 Scoops', timing: 'pre-workout', category: 'Pump Formulation', aliases: ['raw pump', 'pump', 'non-stim'] },
  { name: 'Raw Creatine Monohydrate Pure', brand: 'Raw Nutrition', dose: '5g', timing: 'post-workout', category: 'Micronized Creatine', aliases: ['creatine', 'cbum creatine', 'raw creatine'] },
  { name: 'Raw Essential Pre-Workout Everyday', brand: 'Raw Nutrition', dose: '1 Scoop', timing: 'pre-workout', category: 'Daily Clean Energy', aliases: ['essential pre', 'preworkout'] },

  // ── BARE PERFORMANCE NUTRITION (BPN) ──
  { name: 'Flight Pre-Workout (Clean Energy)', brand: 'Bare Performance Nutrition', dose: '1 Scoop', timing: 'pre-workout', category: 'Pre-Workout & Endurance', aliases: ['bpn flight', 'flight', 'preworkout', 'nick bare'] },
  { name: 'Endopump Muscle Pump Matrix', brand: 'Bare Performance Nutrition', dose: '1 Scoop', timing: 'pre-workout', category: 'Non-Stim Pump & Nitric Oxide', aliases: ['endopump', 'pump', 'bpn'] },
  { name: 'Whey Protein (Whey + Casein Blend)', brand: 'Bare Performance Nutrition', dose: '1 Scoop (33g)', timing: 'post-workout', category: 'Premium Protein Blend', aliases: ['bpn whey', 'protein', 'whey'] },
  { name: 'In-Focus Nootropic Fuel', brand: 'Bare Performance Nutrition', dose: '1 Scoop', timing: 'morning', category: 'Cognitive Clarity & Flow', aliases: ['in focus', 'nootropic', 'focus', 'bpn'] },
  { name: 'G.1.M Sport Carbohydrate & Electrolytes', brand: 'Bare Performance Nutrition', dose: '1 Scoop', timing: 'intra-workout', category: 'Endurance Carb Fuel', aliases: ['g1m', 'cluster dextrin', 'carbs', 'intra'] },
  { name: 'Strong Greens Daily Superfood Powder', brand: 'Bare Performance Nutrition', dose: '1 Scoop', timing: 'morning', category: 'Immune & Gut Health', aliases: ['strong greens', 'greens', 'superfood'] },

  // ── REDCON1 ──
  { name: 'Total War Pre-Workout High Intensity', brand: 'Redcon1', dose: '1 Scoop (14.7g)', timing: 'pre-workout', category: 'High-Stim Energy & Focus', aliases: ['total war', 'preworkout', 'redcon', 'caffeine'] },
  { name: 'Big Noise Non-Stim Pump Pre', brand: 'Redcon1', dose: '1 Scoop', timing: 'pre-workout', category: 'Vasodilator & Focus', aliases: ['big noise', 'pump', 'non-stim'] },
  { name: 'MRE Real Whole Food Protein', brand: 'Redcon1', dose: '4 Scoops (130g)', timing: 'post-workout', category: 'Whole Food Meal Replacement', aliases: ['mre', 'meal replacement', 'beef protein', 'salmon'] },
  { name: 'MRE Lite Animal Protein (Low Carb)', brand: 'Redcon1', dose: '1 Scoop (29g)', timing: 'post-workout', category: 'Whole Food Protein Isolate', aliases: ['mre lite', 'protein', 'low carb'] },
  { name: 'Isotope 100% Whey Isolate', brand: 'Redcon1', dose: '1 Scoop (32g)', timing: 'post-workout', category: 'Whey Protein Isolate', aliases: ['isotope', 'isolate', 'whey'] },
  { name: 'Double Tap Fat Burner Powder', brand: 'Redcon1', dose: '1 Scoop', timing: 'morning', category: 'Metabolic Fat Burner', aliases: ['double tap', 'fat burner', 'thermogenic'] },

  // ── EHPLABS ──
  { name: 'OxyShred Ultra Thermogenic Fat Burner', brand: 'EHPlabs', dose: '1 Scoop', timing: 'morning', category: 'Metabolism & Fat Burning', aliases: ['oxyshred', 'oxy shred', 'fat burner', 'ehp labs', 'ehplabs'] },
  { name: 'OxyWhey 100% Lean Whey Protein', brand: 'EHPlabs', dose: '1 Scoop (31g)', timing: 'post-workout', category: 'Whey Protein & Digestion', aliases: ['oxywhey', 'ehplabs protein', 'protein'] },
  { name: 'Pride Pre-Workout King of Energy', brand: 'EHPlabs', dose: '1-2 Scoops', timing: 'pre-workout', category: '5-Stage Sustained Energy', aliases: ['pride', 'preworkout', 'ehplabs'] },
  { name: 'Beyond BCAA + EAA Intra-Workout', brand: 'EHPlabs', dose: '1-2 Scoops', timing: 'intra-workout', category: 'Hydration & Muscle Recovery', aliases: ['beyond bcaa', 'eaa', 'bcaa', 'recovery'] },

  // ── KAGED (KAGED MUSCLE) ──
  { name: 'Pre-Kaged Elite Advanced Pre-Workout', brand: 'Kaged', dose: '1 Scoop (35g)', timing: 'pre-workout', category: 'Elite All-In-One Pre-Workout', aliases: ['pre kaged', 'kaged preworkout', 'pre-kaged', 'kaged muscle'] },
  { name: 'Pre-Kaged Non-Stim Pump Matrix', brand: 'Kaged', dose: '1 Scoop', timing: 'pre-workout', category: 'Caffeine-Free Pre-Workout', aliases: ['pre kaged non-stim', 'pump', 'kaged'] },
  { name: 'Kaged Whey Protein Isolate Micro-Pure', brand: 'Kaged', dose: '1 Scoop (32g)', timing: 'post-workout', category: 'Whey Protein Isolate', aliases: ['kaged protein', 'whey', 'isolate'] },
  { name: 'Hydra-Charge Electrolyte Matrix', brand: 'Kaged', dose: '1 Scoop', timing: 'intra-workout', category: 'Hydration & Antioxidants', aliases: ['hydracharge', 'hydra charge', 'electrolytes'] },
  { name: 'Kaged Creatine HCl Micro-Pure', brand: 'Kaged', dose: '1-2 Scoops (750mg-1500mg)', timing: 'pre-workout', category: 'Soluble Creatine Hydrochloride', aliases: ['creatine hcl', 'kaged creatine', 'hcl'] },

  // ── DYMATIZE ──
  { name: 'ISO100 Hydrolyzed 100% Whey Isolate', brand: 'Dymatize', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Hydrolyzed Whey Isolate', aliases: ['iso100', 'dymatize iso 100', 'protein', 'fruity pebbles'] },
  { name: 'Elite 100% Whey Protein', brand: 'Dymatize', dose: '1 Scoop (36g)', timing: 'post-workout', category: 'Whey Protein Blend', aliases: ['elite whey', 'dymatize whey', 'protein'] },
  { name: 'Super Mass Gainer High Calorie', brand: 'Dymatize', dose: '2 Scoops (333g)', timing: 'post-workout', category: 'Weight Gainer', aliases: ['mass gainer', 'super mass', 'dymatize'] },
  { name: 'All 9 Amino (Full Spectrum EAAs)', brand: 'Dymatize', dose: '1 Scoop (15g)', timing: 'intra-workout', category: 'Essential Amino Acids', aliases: ['all 9 amino', 'eaa', 'bcaa'] },

  // ── BUCKED UP (DAS LABS) ──
  { name: 'Bucked Up Pre-Workout (Deer Antler Velvet)', brand: 'Bucked Up', dose: '1 Scoop (10g)', timing: 'pre-workout', category: 'Classic Pre-Workout', aliases: ['bucked up', 'preworkout', 'deer antler'] },
  { name: 'WOKE AF High Stimulant Pre-Workout', brand: 'Bucked Up', dose: '1 Scoop (12g)', timing: 'pre-workout', category: 'Extreme Stimulant Focus', aliases: ['woke af', 'preworkout', 'high stim', 'caffeine'] },
  { name: 'BAMF Nootropic Pre-Workout', brand: 'Bucked Up', dose: '1 Scoop', timing: 'pre-workout', category: 'Hyper-Focus Brain Pre', aliases: ['bamf', 'nootropic preworkout', 'focus'] },
  { name: 'Buck Feed 100% Grass-Fed Whey', brand: 'Bucked Up', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Grass-Fed Whey Protein', aliases: ['buck feed', 'whey protein', 'bucked up protein'] },

  // ── RYSE SUPPLS ──
  { name: 'Godzilla Pre-Workout (Monster 40g Formula)', brand: 'Ryse', dose: '1-2 Scoops', timing: 'pre-workout', category: 'Massive Dosed Pre-Workout', aliases: ['godzilla', 'ryse godzilla', 'preworkout', 'citrulline'] },
  { name: 'Loaded Pre-Workout (Ring Pop / Sunny D)', brand: 'Ryse', dose: '1 Scoop', timing: 'pre-workout', category: 'Flavored Energy Pre', aliases: ['ryse loaded', 'loaded pre', 'ring pop', 'sunny d'] },
  { name: 'Loaded Protein 100% Whey (Skippy / Cinnamon Toast)', brand: 'Ryse', dose: '1 Scoop (33g)', timing: 'post-workout', category: 'Gourmet Whey Blend', aliases: ['ryse protein', 'skippy', 'cinnamon toast', 'loaded protein'] },

  // ── ANIMAL / UNIVERSAL NUTRITION ──
  { name: 'Animal Pak Multivitamin Training Complex', brand: 'Animal', dose: '1 Pack (Pills)', timing: 'morning', category: 'Hardcore Athlete Multivitamin', aliases: ['animal pak', 'pak', 'multivitamin', 'universal'] },
  { name: 'Animal Flex Joint Support Complex', brand: 'Animal', dose: '1 Pack (Pills)', timing: 'morning', category: 'Ligament & Joint Cartilage', aliases: ['animal flex', 'joints', 'glucosamine', 'chondroitin'] },
  { name: 'Animal Cuts Thermogenic Shredder', brand: 'Animal', dose: '1 Pack', timing: 'morning', category: 'Complete Fat Burning Stack', aliases: ['animal cuts', 'cuts', 'fat burner', 'water shed'] },
  { name: 'Animal PM Sleep & Growth Matrix', brand: 'Animal', dose: '1 Pack', timing: 'bedtime', category: 'GH & Night Recovery', aliases: ['animal pm', 'sleep', 'growth hormone', 'gaba'] },

  // ── ALPHA LION ──
  { name: 'SuperHuman Pre-Workout High Performance', brand: 'Alpha Lion', dose: '1-2 Scoops', timing: 'pre-workout', category: 'Energy & Pump Pre', aliases: ['superhuman', 'super human', 'alpha lion pre'] },
  { name: 'SuperHuman Pump Non-Stim Vaso', brand: 'Alpha Lion', dose: '1 Scoop', timing: 'pre-workout', category: 'Nitric Oxide & Cellular Hydration', aliases: ['superhuman pump', 'pump', 'alpha lion'] },
  { name: 'SuperHuman Sleep Night Anabolic Matrix', brand: 'Alpha Lion', dose: '1 Scoop', timing: 'bedtime', category: 'Deep Sleep & Muscle Repair', aliases: ['superhuman sleep', 'sleep', 'gaba'] },

  // ── NUTRA BIO ──
  { name: '100% Whey Protein Isolate Clean Pure', brand: 'NutraBio', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Non-Denatured Isolate', aliases: ['nutrabio', 'nutrabio isolate', 'protein'] },
  { name: 'PRE Pre-Workout Fully Disclosed', brand: 'NutraBio', dose: '1 Scoop (28g)', timing: 'pre-workout', category: 'Clinical Dosed Pre-Workout', aliases: ['nutrabio pre', 'preworkout'] },
  { name: 'Pure Creatine Monohydrate Pharma Grade', brand: 'NutraBio', dose: '5g', timing: 'post-workout', category: 'Pharma Grade Creatine', aliases: ['nutrabio creatine', 'creapure', 'creatine'] },

  // ── NOW SPORTS / NOW FOODS ──
  { name: 'Creatine Monohydrate Micronized', brand: 'NOW Sports', dose: '5g (1 Heaping Tsp)', timing: 'post-workout', category: 'Strength & Performance', aliases: ['now creatine', 'now sports', 'creatine'] },
  { name: 'Whey Protein Isolate Pure Unflavored', brand: 'NOW Sports', dose: '1 Scoop (28g)', timing: 'post-workout', category: 'Pure Unflavored Whey', aliases: ['now whey', 'unflavored protein', 'protein'] },
  { name: 'L-Glutamine Free Form 1000mg', brand: 'NOW Sports', dose: '1-2 Capsules', timing: 'post-workout', category: 'Gut Barrier & Recovery', aliases: ['glutamine', 'now glutamine', 'gut'] },
  { name: 'L-Citrulline Pure Powder 1200mg', brand: 'NOW Sports', dose: '1/2 Teaspoon', timing: 'pre-workout', category: 'Nitric Oxide Precursor', aliases: ['citrulline', 'pump', 'vasodilation'] },
  { name: 'Beta-Alanine Endurance Powder', brand: 'NOW Sports', dose: '2g (1/2 Tsp)', timing: 'pre-workout', category: 'Muscular Endurance & Carnosine', aliases: ['beta alanine', 'tingles', 'endurance'] },
  { name: 'Omega-3 Molecularly Distilled Fish Oil', brand: 'NOW Foods', dose: '2 Softgels', timing: 'morning', category: 'Cardiovascular Support', aliases: ['fish oil', 'omega 3', 'now omega 3'] },
  { name: 'Magnesium Bisglycinate Chelate 200mg', brand: 'NOW Foods', dose: '2 Tablets', timing: 'bedtime', category: 'Nervous System & Muscle Relaxation', aliases: ['magnesium', 'glycinate', 'sleep'] },
  { name: 'NAC (N-Acetyl Cysteine) 600mg', brand: 'NOW Foods', dose: '1 Capsule', timing: 'morning', category: 'Glutathione & Liver Support', aliases: ['nac', 'liver', 'antioxidant'] },
  { name: 'TUDCA (Tauroursodeoxycholic Acid) 250mg', brand: 'NOW Foods', dose: '1 Capsule', timing: 'morning', category: 'Bile Acid & Hepatic Health', aliases: ['tudca', 'liver', 'bile'] },
  { name: 'Zinc Picolinate 50mg High Absorption', brand: 'NOW Foods', dose: '1 Capsule', timing: 'evening', category: 'Immune & Testosterone Matrix', aliases: ['zinc', 'immunity', 'testosterone'] },
  { name: 'Ashwagandha Standardized Extract 450mg', brand: 'NOW Foods', dose: '1 Capsule', timing: 'evening', category: 'Adaptogen & Stress Reduction', aliases: ['ashwagandha', 'withania', 'stress'] },
  { name: 'Tongkat Ali (Longjack) 300mg', brand: 'NOW Foods', dose: '1 Capsule', timing: 'morning', category: 'Free Testosterone & Libido', aliases: ['tongkat ali', 'longjack', 'testosterone'] },
  { name: 'Vitamin D-3 5000 IU High Potency', brand: 'NOW Foods', dose: '1 Softgel', timing: 'morning', category: 'Immune & Bone Health', aliases: ['vitamin d', 'd3', 'cholecalciferol'] },

  // ── PURE ENCAPSULATIONS ──
  { name: 'O.N.E. Multivitamin with CoQ10 & Metafolin', brand: 'Pure Encapsulations', dose: '1 Capsule', timing: 'morning', category: 'Hypoallergenic Micronutrients', aliases: ['one multi', 'pure multi', 'multivitamin'] },
  { name: 'Magnesium (Glycinate) 120mg', brand: 'Pure Encapsulations', dose: '2 Capsules', timing: 'bedtime', category: 'Rest & Neurological Balance', aliases: ['magnesium', 'pure magnesium', 'sleep'] },
  { name: 'Zinc 30 (Zinc Citrate)', brand: 'Pure Encapsulations', dose: '1 Capsule', timing: 'evening', category: 'Immunity & Cellular Repair', aliases: ['zinc', 'pure zinc'] },
  { name: 'EPA/DHA with Lemon 1000mg', brand: 'Pure Encapsulations', dose: '2 Softgels', timing: 'morning', category: 'Pure Omega-3 EPA/DHA', aliases: ['fish oil', 'omega 3'] },
  { name: 'Curcumin 500 with Bioperine', brand: 'Pure Encapsulations', dose: '1 Capsule', timing: 'evening', category: 'Joint & Inflammatory Response', aliases: ['curcumin', 'turmeric'] },

  // ── LIFE EXTENSION ──
  { name: 'Two-Per-Day High Potency Multivitamin', brand: 'Life Extension', dose: '2 Capsules', timing: 'morning', category: 'Essential Daily Minerals', aliases: ['two per day', 'life extension multi', 'vitamins'] },
  { name: 'Super Omega-3 Plus EPA/DHA with Sesame Lignans', brand: 'Life Extension', dose: '2 Softgels', timing: 'morning', category: 'Cardiovascular Longevity', aliases: ['omega 3', 'super omega', 'fish oil'] },
  { name: 'Neuro-Mag Magnesium L-Threonate', brand: 'Life Extension', dose: '3 Capsules (144mg Elemental)', timing: 'bedtime', category: 'Brain Magnesium & Cognition', aliases: ['magnesium threonate', 'neuromag', 'brain', 'sleep'] },
  { name: 'Super K with Advanced K2 Complex', brand: 'Life Extension', dose: '1 Softgel', timing: 'morning', category: 'Arterial & Bone Calcium Directing', aliases: ['vitamin k', 'k2', 'mk7'] },
  { name: 'Bio-Fisetin with Fenugreek', brand: 'Life Extension', dose: '1 Capsule', timing: 'morning', category: 'Senolytic & Longevity', aliases: ['fisetin', 'anti-aging', 'longevity'] },
  { name: 'Super Ubiquinol CoQ10 with Enhanced Mitochondrial Drive', brand: 'Life Extension', dose: '1 Softgel (100mg)', timing: 'morning', category: 'Mitochondria & Heart Energy', aliases: ['coq10', 'ubiquinol', 'heart'] },

  // ── BULKSUPPLEMENTS & SPORTS RESEARCH ──
  { name: 'Sports Research Organic Collagen Peptides (Type I & III)', brand: 'Sports Research', dose: '1 Scoop (11g)', timing: 'morning', category: 'Joint, Skin & Hair Cartilage', aliases: ['collagen', 'peptides', 'joints', 'skin'] },
  { name: 'Sports Research Triple Strength Omega-3 Wild Alaskan', brand: 'Sports Research', dose: '1 Softgel (1037mg Omega-3)', timing: 'morning', category: 'High-Concentrate EPA/DHA', aliases: ['omega 3', 'fish oil', 'sports research'] },
  { name: 'Sports Research Vitamin D3 5000 IU + K2 MK7 with Coconut Oil', brand: 'Sports Research', dose: '1 Softgel', timing: 'morning', category: 'Hormone & Bone Synergy', aliases: ['vitamin d3 k2', 'd3', 'k2', 'sports research'] },
  { name: 'Pure L-Citrulline Malate 2:1 Powder', brand: 'BulkSupplements', dose: '6g - 8g', timing: 'pre-workout', category: 'Vasodilation & Pump Matrix', aliases: ['citrulline malate', 'pump', 'bulk citrulline'] },
  { name: 'Beta-Alanine Pure Unflavored Powder', brand: 'BulkSupplements', dose: '3.2g', timing: 'pre-workout', category: 'High Rep Carnosine Buffer', aliases: ['beta alanine', 'endurance', 'bulk'] },
  { name: 'L-Theanine 200mg Smooth Focus', brand: 'BulkSupplements', dose: '1 Capsule (200mg)', timing: 'morning', category: 'Jitter Reduction & Calm Focus', aliases: ['theanine', 'l theanine', 'caffeine pair'] },
  { name: 'Alpha GPC 50% Powder (Choline Donor)', brand: 'BulkSupplements', dose: '600mg', timing: 'pre-workout', category: 'Acetylcholine & Focus', aliases: ['alpha gpc', 'choline', 'mind muscle'] },
  { name: 'L-Tyrosine 500mg (Dopamine Precursor)', brand: 'BulkSupplements', dose: '1000mg', timing: 'pre-workout', category: 'Stress & Neurotransmitter Support', aliases: ['tyrosine', 'l tyrosine', 'dopamine'] },
  { name: 'Tart Cherry Extract 1000mg', brand: 'Sports Research', dose: '1 Softgel', timing: 'bedtime', category: 'DOMS Reduction & Natural Melatonin', aliases: ['tart cherry', 'soreness', 'sleep'] },

  // ── O1FC OFFICIAL HYPER-DRIVE FORMULAS ──
  { name: 'O1FC Official Pure Creapure Creatine', brand: 'O1FC Official', dose: '5g', timing: 'post-workout', category: 'Phosphocreatine Resynthesis', aliases: ['o1fc creatine', 'ofc creatine', 'creatine', 'creapure'] },
  { name: 'O1FC Official Hydro-ISO 100% Whey Isolate', brand: 'O1FC Official', dose: '1 Scoop (30g)', timing: 'post-workout', category: 'Rapid Anabolic Absorption', aliases: ['o1fc protein', 'ofc protein', 'whey', 'isolate', 'protien'] },
  { name: 'O1FC Official Hyper-Drive Pre-Workout V2', brand: 'O1FC Official', dose: '1 Scoop (20g)', timing: 'pre-workout', category: 'Neuro-Vascular Blood Flow', aliases: ['o1fc pre', 'ofc pre', 'preworkout', 'hyperdrive'] },
  { name: 'O1FC Official Night-Volt Sleep Catalyst', brand: 'O1FC Official', dose: '3 Capsules', timing: 'bedtime', category: 'Delta Wave Recovery & GH', aliases: ['sleep', 'night volt', 'magnesium', 'gaba'] },
  { name: 'O1FC Official Pure Electrolyte Hydration', brand: 'O1FC Official', dose: '1 Stick Pack (500mg Na / 200mg K)', timing: 'intra-workout', category: 'Osmotic Cellular Hydration', aliases: ['electrolytes', 'salt', 'hydration'] },
  { name: 'Lion’s Mane Mushroom Extract 8:1', brand: 'O1FC Official', dose: '1000mg', timing: 'morning', category: 'NGF & Neurogenesis', aliases: ['lions mane', 'mushroom', 'focus', 'brain'] },
  { name: 'Tongkat Ali LJ100 Eurycoma Longifolia', brand: 'O1FC Official', dose: '200mg', timing: 'morning', category: 'Free Testosterone Mobilization', aliases: ['tongkat', 'testosterone', 'libido'] },
];

/**
 * Intelligent supplement search matching brands, products, aliases, typos and categories
 */
export function searchSupplementCatalog(query: string): CatalogSupplement[] {
  const cleanQ = query.toLowerCase().trim().replace(/['"’]/g, '');
  if (!cleanQ) return SUPPLEMENT_DATABASE;

  // Typo normalizer
  const normalizedQ = cleanQ
    .replace(/\bprotien\b/g, 'protein')
    .replace(/\bcreatene\b/g, 'creatine')
    .replace(/\bashwaganda\b/g, 'ashwagandha')
    .replace(/\bpreworkout\b/g, 'pre workout')
    .replace(/\bpre-workout\b/g, 'pre workout')
    .replace(/\bmultivit\b/g, 'multivitamin')
    .replace(/\bvitamen\b/g, 'vitamin');

  const terms = normalizedQ.split(/\s+/).filter(Boolean);

  return SUPPLEMENT_DATABASE.filter((item) => {
    const brandStr = item.brand.toLowerCase().replace(/['"’]/g, '');
    const nameStr = item.name.toLowerCase().replace(/['"’]/g, '');
    const categoryStr = item.category.toLowerCase().replace(/['"’]/g, '');
    const aliasesStr = (item.aliases || []).join(' ').toLowerCase().replace(/['"’]/g, '');

    const combined = `${brandStr} ${nameStr} ${categoryStr} ${aliasesStr}`;

    // Check if every term in query matches somewhere in the item's info
    return terms.every((term) => {
      if (combined.includes(term)) return true;
      // Handle brand variations like "myprotein" vs "my protein"
      if (term === 'my' && (brandStr.includes('myprotein') || nameStr.includes('myprotein'))) return true;
      if (term === 'protein' && (brandStr.includes('myprotein') || nameStr.includes('protein') || categoryStr.includes('protein'))) return true;
      if (term === 'nation' && brandStr.includes('muscle nation')) return true;
      if (term === 'muscle' && (brandStr.includes('muscle nation') || brandStr.includes('muscle') || nameStr.includes('muscle'))) return true;
      if (term === 'revive' && (brandStr.includes('revive') || nameStr.includes('revive'))) return true;
      if (term === 'evogen' && (brandStr.includes('evogen') || nameStr.includes('evogen'))) return true;
      return false;
    });
  });
}
