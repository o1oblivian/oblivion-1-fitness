// Supplement database for online search
export const SUPPLEMENT_KNOWLEDGE_BASE: Array<{
  name: string;
  category: string;
  clinicalDosage: string;
  timing: string;
  primaryBenefits: string;
  mechanismOfAction: string;
  synergyStack: string;
  safetyNote?: string;
}> = [
  {
    name: 'Creatine Monohydrate',
    category: 'Performance / Strength',
    clinicalDosage: '5g daily (Creapure micronized)',
    timing: 'Post-workout or morning with carbohydrates',
    primaryBenefits:
      'Increases phosphocreatine cellular reserves, maximum force output, muscle cell hydration',
    mechanismOfAction:
      'Rapidly resynthesizes ATP from ADP during high-intensity anaerobic contractions',
    synergyStack:
      'Pairs synergistically with post-workout carbohydrates (30-50g) and Whey Protein for enhanced intramuscular uptake',
  },
  {
    name: 'Omega-3 Fish Oil (High EPA/DHA)',
    category: 'Recovery / Anti-inflammatory',
    clinicalDosage: '2,000mg - 3,000mg total EPA+DHA daily',
    timing: 'With a fat-containing meal (Breakfast or Dinner)',
    primaryBenefits:
      'Reduces systemic delayed onset muscle soreness (DOMS), supports heart health, optimizes cellular membrane fluidity',
    mechanismOfAction:
      'Incorporates into cell membrane phospholipids, displacing arachidonic acid and generating pro-resolving mediators (resolvins/protectins)',
    synergyStack:
      'Stack with Vitamin D3 + K2 and Curcumin for full-spectrum systemic joint & tissue recovery',
  },
  {
    name: 'Magnesium Bisglycinate',
    category: 'Sleep / Nervous System',
    clinicalDosage: '300mg - 400mg elemental magnesium',
    timing: '30-45 minutes before sleep',
    primaryBenefits:
      'Deep slow-wave sleep architecture, muscle relaxation, neurochemical calming, prevents nocturnal cramping',
    mechanismOfAction:
      'Acts as natural NMDA receptor blocker and positive allosteric modulator of GABA-A receptors',
    synergyStack:
      'Stack with L-Theanine (200mg) and Apigenin for non-habit forming deep sleep protocol',
  },
  {
    name: 'Vitamin D3 + K2 (MK-7)',
    category: 'Endocrine / Bone Mineral',
    clinicalDosage: '5,000 IU D3 + 100mcg K2 (as Menaquinone-7)',
    timing: 'Morning with healthy fats (e.g., eggs or avocado)',
    primaryBenefits:
      'Maintains optimal free testosterone levels, boosts bone mineral density, optimizes immune resilience',
    mechanismOfAction:
      'D3 acts as a steroid pre-hormone; K2 activates osteocalcin and MGP to shuttle calcium directly into bones away from arterial walls',
    synergyStack:
      'Combine with dietary dietary fats and Zinc Picolinate for complete endocrine axis priming',
  },
  {
    name: 'L-Citrulline Malate 2:1',
    category: 'Blood Flow / Pumps',
    clinicalDosage: '6,000mg - 8,000mg pure Citrulline Malate',
    timing: '30-45 minutes pre-training',
    primaryBenefits:
      'Supraphysiological vasodilation, increases muscular pump, buffers ammonia accumulation, delays fatigue',
    mechanismOfAction:
      'Bypasses hepatic first-pass metabolism, elevating systemic L-Arginine plasma concentrations to stimulate endothelial nitric oxide synthase (eNOS)',
    synergyStack:
      'Stack with Beta-Alanine (3.2g) and Himalayan Pink Salt (1g) for elite pre-workout pump and cellular hydration',
  },
  {
    name: 'Beta-Alanine',
    category: 'Endurance / Acidity Buffer',
    clinicalDosage: '3.2g - 6.4g daily (divided doses to limit paresthesia)',
    timing: 'Pre-workout or anytime during the day',
    primaryBenefits:
      'Enhances capacity in the 60-240 second anaerobic endurance window, increases sprint repeats',
    mechanismOfAction:
      'Rate-limiting precursor in carnosine synthesis, buffering intracellular hydrogen ion (H+) accumulation in working myocytes',
    synergyStack:
      'Stack with Sodium Bicarbonate and Creatine for maximal repeated-sprint power output',
  },
  {
    name: 'Ashwagandha (KSM-66 Full Spectrum)',
    category: 'Adaptogen / Cortisol Modulation',
    clinicalDosage: '600mg daily (standardized to 5% withanolides)',
    timing: 'Evening with dinner or post-training',
    primaryBenefits:
      'Blunts exercise-induced hypercortisolemia, stabilizes resting heart rate variability (HRV), promotes calm resilience',
    mechanismOfAction:
      'Regulates hypothalamic-pituitary-adrenal (HPA) axis activity and balances circulating serum cortisol levels',
    synergyStack:
      'Stack with Phosphatidylserine (PS) during intense high-volume training blocks to prevent CNS overreaching',
  },
  {
    name: 'Alpha-GPC (L-Alpha Glycerylphosphorylcholine)',
    category: 'Nootropic / Mind-Muscle Focus',
    clinicalDosage: '300mg - 600mg (50% yield)',
    timing: '30 minutes before heavy lifting or skill training',
    primaryBenefits:
      'Heightened motor unit recruitment, explosive power output, razor-sharp cognitive focus',
    mechanismOfAction:
      'Directly crosses the blood-brain barrier to serve as an immediate precursor for acetylcholine synthesis in neuromuscular junctions',
    synergyStack:
      'Stack with Caffeine (150mg) and L-Theanine (150mg) for clean, jitter-free motor drive',
  },
  {
    name: 'Tactical Electrolyte Matrix (Sodium / Potassium / Magnesium)',
    category: 'Hydration / Cell Osmolytes',
    clinicalDosage: '1,000mg Sodium, 200mg Potassium, 60mg Magnesium per liter',
    timing: 'Intra-workout or first thing upon waking',
    primaryBenefits:
      'Maintains blood plasma volume, prevents cramping, maximizes neural firing velocity, sustains cardiac output in heat',
    mechanismOfAction:
      'Regulates cellular sodium-potassium ATP-ase pumps and vascular oncotic pressure',
    synergyStack:
      'Add 10g Essential Amino Acids (EAAs) and 20g Cyclic Dextrin during intense workouts',
  },
  {
    name: 'Zinc Picolinate',
    category: 'Immunity / Androgen Support',
    clinicalDosage: '25mg - 30mg elemental zinc',
    timing: 'Evening with a meal (avoid taking with calcium)',
    primaryBenefits:
      'Accelerates soft tissue repair, enzymatic cofactor for over 300 metabolic pathways, supports LH and testosterone synthesis',
    mechanismOfAction:
      'Essential structural component of zinc-finger DNA transcription factors and superoxide dismutase (SOD)',
    synergyStack:
      'Stack with Copper (1-2mg) on long cycles to maintain optimal copper-zinc plasma ratio',
  },
];
