import React, { useState } from 'react';
import { ExternalLink, BookOpen, ShieldAlert, CheckCircle2, ChevronRight, X } from 'lucide-react';

export interface MedicalCitation {
  id: string;
  category: 'Metabolic & BMR' | 'Nutrition & Macros' | 'Cardio & Active Burn' | 'Strength & 1RM';
  title: string;
  authors: string;
  journal: string;
  year: string;
  summary: string;
  doiUrl?: string;
  pubmedUrl?: string;
  govUrl?: string;
}

export const CLINICAL_CITATIONS: MedicalCitation[] = [
  {
    id: 'mifflin-1990',
    category: 'Metabolic & BMR',
    title: 'A new predictive equation for resting energy expenditure in healthy individuals',
    authors: 'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO.',
    journal: 'The American Journal of Clinical Nutrition',
    year: '1990; 51(2): 241–247',
    summary: 'The clinically validated Mifflin-St Jeor equation used in Fuel OS to calculate Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE). Proven within 10% of indirect calorimetry.',
    doiUrl: 'https://doi.org/10.1093/ajcn/51.2.241',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
  },
  {
    id: 'usda-guidelines-2020',
    category: 'Nutrition & Macros',
    title: 'Dietary Guidelines for Americans, 2020–2025 (9th Edition)',
    authors: 'U.S. Department of Agriculture & U.S. Department of Health and Human Services',
    journal: 'USDA Dietary Guidelines Advisory Committee Report',
    year: '2020–2025',
    summary: 'Federal dietary reference intakes establishing Acceptable Macronutrient Distribution Ranges (AMDR): Protein (10–35%), Carbohydrates (45–65%), and Dietary Fats (20–35% of total caloric intake).',
    govUrl: 'https://www.dietaryguidelines.gov/',
  },
  {
    id: 'acsm-nutrition-2016',
    category: 'Nutrition & Macros',
    title: 'Joint Position Statement: Nutrition and Athletic Performance',
    authors: 'Thomas DT, Erdman KA, Burke LM (ACSM, Academy of Nutrition and Dietetics, Dietitians of Canada)',
    journal: 'Medicine & Science in Sports & Exercise',
    year: '2016; 48(3): 543–568',
    summary: 'Evidence-based recommendations for athletic macronutrient intake, recovery protein pacing (1.2–2.0 g/kg/day), carbohydrate timing, and electrolyte hydration for endurance and resistance training.',
    doiUrl: 'https://doi.org/10.1249/MSS.0000000000000852',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/26891140/',
  },
  {
    id: 'ainsworth-compendium-2011',
    category: 'Cardio & Active Burn',
    title: '2011 Compendium of Physical Activities: A Second Update of Codes and MET Values',
    authors: 'Ainsworth BE, Haskell WL, Herrmann SD, et al.',
    journal: 'Medicine & Science in Sports & Exercise',
    year: '2011; 43(8): 1575–1581',
    summary: 'Standardized reference of Metabolic Equivalent of Task (MET) codes used in our History Log and Active Burn engines to calculate caloric expenditure based on body mass and exercise intensity.',
    doiUrl: 'https://doi.org/10.1249/MSS.0b013e31821ece12',
    pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/21681120/',
  },
  {
    id: 'brzycki-1rm-1993',
    category: 'Strength & 1RM',
    title: 'Strength Testing—Predicting a One-Rep Max from Reps to Fatigue',
    authors: 'Brzycki, Matt.',
    journal: 'Journal of Physical Education, Recreation & Dance',
    year: '1993; 64(1): 88–90',
    summary: 'The clinically adopted Brzycki predictive equation: 1RM = Weight / (1.0278 - (0.0278 × Reps)), used in Training OS to calculate submaximal strength baselines without spinal overexertion.',
    doiUrl: 'https://doi.org/10.1080/07303084.1993.10606684',
  },
  {
    id: 'who-activity-2020',
    category: 'Cardio & Active Burn',
    title: 'WHO Guidelines on Physical Activity and Sedentary Behaviour',
    authors: 'World Health Organization (WHO)',
    journal: 'WHO Guidelines Approved by the Guidelines Review Committee',
    year: '2020',
    summary: 'Global clinical recommendations advising 150–300 minutes of moderate-intensity or 75–150 minutes of vigorous-intensity aerobic physical activity weekly for optimal metabolic and cardiovascular health.',
    govUrl: 'https://www.who.int/publications/i/item/9789240015128',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalCitationsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Metabolic & BMR', 'Nutrition & Macros', 'Cardio & Active Burn', 'Strength & 1RM'];

  const filtered = selectedCategory === 'All'
    ? CLINICAL_CITATIONS
    : CLINICAL_CITATIONS.filter(c => c.category === selectedCategory);

  return (
    <div 
      className="fixed inset-0 z-[500] bg-black/70 dark:bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-zinc-950 rounded-t-[1.75rem] sm:rounded-2xl shadow-2xl border-t sm:border border-zinc-200/80 dark:border-zinc-800 flex flex-col overflow-hidden pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-[#C4121A] dark:text-[#D91F28]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                Clinical & Scientific Citations
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Peer-reviewed medical literature & nutritional sources
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Medical Disclaimer Banner */}
        <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
            <strong className="font-semibold">Medical Disclaimer:</strong> Oblivion 1 Fitness Club (O1FC) metabolic calculations, resting energy expenditure, and nutritional estimations are provided for athletic and educational purposes only. They do not constitute clinical diagnosis or medical advice. Always consult a licensed physician or registered dietitian before changing your diet or training regimen.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 pt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#C4121A] dark:bg-[#D91F28] text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable List of Citations */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((cit) => (
            <div
              key={cit.id}
              className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4121A] dark:text-[#D91F28] px-2 py-0.5 rounded-md bg-red-500/10">
                  {cit.category}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {cit.year}
                </span>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white leading-snug">
                  {cit.title}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 italic">
                  {cit.authors} — <span className="font-medium text-zinc-700 dark:text-zinc-300">{cit.journal}</span>
                </p>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-white/70 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {cit.summary}
              </p>

              {/* Source links */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {cit.pubmedUrl && (
                  <a
                    href={cit.pubmedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 transition-colors"
                  >
                    <span>PubMed Central</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {cit.doiUrl && (
                  <a
                    href={cit.doiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 transition-colors"
                  >
                    <span>Journal DOI</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {cit.govUrl && (
                  <a
                    href={cit.govUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 transition-colors"
                  >
                    <span>Official Guidelines</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C4121A] dark:text-[#D91F28]" />
            <span>Compliant with Apple Guideline 1.4.1</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact inline banner card to display directly inside Fuel and Log sections
 */
export const ClinicalCitationsCard: React.FC<{
  sectionName?: 'Fuel OS' | 'History Log';
  onOpenModal: () => void;
}> = ({ sectionName = 'Fuel OS', onOpenModal }) => {
  return (
    <div className="my-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-[#C4121A] dark:text-[#D91F28] shrink-0 mt-0.5">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                Medical & Scientific Citations
              </h4>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              {sectionName === 'Fuel OS' 
                ? 'Calculations based on Mifflin-St Jeor equation (Am J Clin Nutr 1990) and USDA Dietary Guidelines.'
                : 'Cardio expenditure & 1RM based on Compendium of Physical Activities (METs 2011) and Brzycki strength models.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenModal}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-[#C4121A] dark:text-[#D91F28] hover:underline px-2.5 py-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <span>View Sources</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Quick External Links Row */}
      <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500">
        <span className="font-semibold text-zinc-600 dark:text-zinc-400">Sources:</span>
        <a 
          href="https://pubmed.ncbi.nlm.nih.gov/2305711/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-500 hover:underline flex items-center gap-0.5"
        >
          Mifflin-St Jeor (PubMed) <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <span className="text-zinc-300 dark:text-zinc-700">•</span>
        <a 
          href="https://www.dietaryguidelines.gov/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-purple-500 hover:underline flex items-center gap-0.5"
        >
          USDA Guidelines <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <span className="text-zinc-300 dark:text-zinc-700">•</span>
        <a 
          href="https://pubmed.ncbi.nlm.nih.gov/21681120/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-emerald-500 hover:underline flex items-center gap-0.5"
        >
          Ainsworth METs (PubMed) <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
