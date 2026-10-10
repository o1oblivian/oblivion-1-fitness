import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Check, Loader2, Sparkles, AlertCircle, Edit3, Volume2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { getRegionalFallbackFoods } from '../../../services/theFoodDatabase';

interface VoiceScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  onConfirmFood: (name: string, kcal: number, p: number, c: number, f: number) => void;
}

interface ParsedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  rawIngredients?: string[];
}

// Athletic nutrition density reference (per 100g or common standard unit)
interface NutritionDensity {
  aliases: string[];
  unitGrams: number;
  defaultServing: number; // in grams or count
  isCountBased?: boolean;
  kcalPer100: number;
  pPer100: number;
  cPer100: number;
  fPer100: number;
}

const COMMON_NUTRITION_ITEMS: NutritionDensity[] = [
  // Proteins
  { aliases: ['chicken breast', 'chicken', 'grilled chicken', 'poached chicken'], unitGrams: 100, defaultServing: 180, kcalPer100: 165, pPer100: 31, cPer100: 0, fPer100: 3.6 },
  { aliases: ['chicken thigh', 'chicken thighs'], unitGrams: 100, defaultServing: 180, kcalPer100: 209, pPer100: 26, cPer100: 0, fPer100: 10.9 },
  { aliases: ['egg', 'eggs', 'poached egg', 'boiled egg', 'fried egg', 'scrambled egg', 'scrambled eggs'], unitGrams: 50, defaultServing: 2, isCountBased: true, kcalPer100: 144, pPer100: 12.6, cPer100: 0.8, fPer100: 9.9 },
  { aliases: ['egg white', 'egg whites'], unitGrams: 33, defaultServing: 4, isCountBased: true, kcalPer100: 52, pPer100: 10.9, cPer100: 0.7, fPer100: 0.2 },
  { aliases: ['steak', 'sirloin', 'beef steak', 'ribeye', 'rump steak', 'beef fillet'], unitGrams: 100, defaultServing: 200, kcalPer100: 215, pPer100: 26, cPer100: 0, fPer100: 12 },
  { aliases: ['ground beef', 'minced beef', 'lean beef', 'beef mince'], unitGrams: 100, defaultServing: 180, kcalPer100: 214, pPer100: 24, cPer100: 0, fPer100: 13 },
  { aliases: ['salmon', 'salmon fillet', 'grilled salmon', 'atlantic salmon'], unitGrams: 100, defaultServing: 180, kcalPer100: 208, pPer100: 20, cPer100: 0, fPer100: 13 },
  { aliases: ['tuna', 'canned tuna', 'tuna steak'], unitGrams: 100, defaultServing: 150, kcalPer100: 130, pPer100: 28, cPer100: 0, fPer100: 1 },
  { aliases: ['turkey', 'turkey breast', 'ground turkey'], unitGrams: 100, defaultServing: 180, kcalPer100: 135, pPer100: 30, cPer100: 0, fPer100: 1.5 },
  { aliases: ['whey', 'whey protein', 'protein powder', 'protein shake', 'shake', 'casein'], unitGrams: 30, defaultServing: 1, isCountBased: true, kcalPer100: 400, pPer100: 80, cPer100: 6.6, fPer100: 5 },
  { aliases: ['tofu', 'firm tofu'], unitGrams: 100, defaultServing: 150, kcalPer100: 83, pPer100: 10, cPer100: 2, fPer100: 5 },

  // Carbs
  { aliases: ['white rice', 'jasmine rice', 'basmati rice', 'cooked rice', 'rice'], unitGrams: 100, defaultServing: 180, kcalPer100: 130, pPer100: 2.7, cPer100: 28.2, fPer100: 0.3 },
  { aliases: ['brown rice'], unitGrams: 100, defaultServing: 180, kcalPer100: 112, pPer100: 2.6, cPer100: 24, fPer100: 0.9 },
  { aliases: ['oats', 'oatmeal', 'porridge', 'rolled oats'], unitGrams: 100, defaultServing: 60, kcalPer100: 389, pPer100: 16.9, cPer100: 66.3, fPer100: 6.9 },
  { aliases: ['sweet potato', 'sweet potatoes', 'roasted sweet potato'], unitGrams: 100, defaultServing: 180, kcalPer100: 86, pPer100: 1.6, cPer100: 20.1, fPer100: 0.1 },
  { aliases: ['potato', 'potatoes', 'baked potato', 'boiled potato', 'mash potato', 'mashed potato'], unitGrams: 100, defaultServing: 200, kcalPer100: 87, pPer100: 1.9, cPer100: 20, fPer100: 0.1 },
  { aliases: ['sourdough', 'sourdough bread', 'toast', 'bread', 'sourdough toast', 'slice of bread'], unitGrams: 40, defaultServing: 2, isCountBased: true, kcalPer100: 240, pPer100: 8.5, cPer100: 48, fPer100: 1.2 },
  { aliases: ['pasta', 'cooked pasta', 'spaghetti', 'penne'], unitGrams: 100, defaultServing: 180, kcalPer100: 158, pPer100: 5.8, cPer100: 31, fPer100: 0.9 },
  { aliases: ['banana', 'bananas'], unitGrams: 120, defaultServing: 1, isCountBased: true, kcalPer100: 89, pPer100: 1.1, cPer100: 22.8, fPer100: 0.3 },
  { aliases: ['apple', 'apples'], unitGrams: 150, defaultServing: 1, isCountBased: true, kcalPer100: 52, pPer100: 0.3, cPer100: 13.8, fPer100: 0.2 },
  { aliases: ['berries', 'blueberries', 'strawberries', 'raspberries'], unitGrams: 100, defaultServing: 100, kcalPer100: 57, pPer100: 0.7, cPer100: 14.5, fPer100: 0.3 },

  // Dairy & Alternatives
  { aliases: ['greek yogurt', 'greek yoghurt', 'yoghurt', 'yogurt'], unitGrams: 100, defaultServing: 200, kcalPer100: 75, pPer100: 10, cPer100: 4, fPer100: 2 },
  { aliases: ['milk', 'whole milk', 'full cream milk'], unitGrams: 100, defaultServing: 250, kcalPer100: 62, pPer100: 3.2, cPer100: 4.8, fPer100: 3.3 },
  { aliases: ['skim milk', 'light milk'], unitGrams: 100, defaultServing: 250, kcalPer100: 35, pPer100: 3.4, cPer100: 5, fPer100: 0.2 },
  { aliases: ['almond milk', 'oat milk'], unitGrams: 100, defaultServing: 250, kcalPer100: 25, pPer100: 1, cPer100: 3, fPer100: 1.2 },
  { aliases: ['cheddar', 'cheese', 'parmesan', 'mozzarella'], unitGrams: 100, defaultServing: 30, kcalPer100: 402, pPer100: 25, cPer100: 1.3, fPer100: 33 },

  // Fats & Nuts
  { aliases: ['avocado'], unitGrams: 150, defaultServing: 0.5, isCountBased: true, kcalPer100: 160, pPer100: 2, cPer100: 8.5, fPer100: 14.7 },
  { aliases: ['peanut butter', 'almond butter'], unitGrams: 100, defaultServing: 32, kcalPer100: 588, pPer100: 25, cPer100: 20, fPer100: 50 },
  { aliases: ['olive oil', 'extra virgin olive oil', 'oil'], unitGrams: 100, defaultServing: 14, kcalPer100: 884, pPer100: 0, cPer100: 0, fPer100: 100 },
  { aliases: ['almonds', 'walnuts', 'mixed nuts', 'cashews'], unitGrams: 100, defaultServing: 30, kcalPer100: 590, pPer100: 21, cPer100: 21, fPer100: 50 },

  // Vegetables & Greens
  { aliases: ['broccoli', 'steamed broccoli'], unitGrams: 100, defaultServing: 100, kcalPer100: 34, pPer100: 2.8, cPer100: 6.6, fPer100: 0.4 },
  { aliases: ['spinach', 'baby spinach'], unitGrams: 100, defaultServing: 60, kcalPer100: 23, pPer100: 2.9, cPer100: 3.6, fPer100: 0.4 },
  { aliases: ['asparagus', 'green beans'], unitGrams: 100, defaultServing: 100, kcalPer100: 25, pPer100: 2.5, cPer100: 4, fPer100: 0.2 },

  // Popular athletic / fast meals
  { aliases: ['burger', 'cheeseburger', 'beef burger'], unitGrams: 220, defaultServing: 1, isCountBased: true, kcalPer100: 250, pPer100: 14, cPer100: 21, fPer100: 13 },
  { aliases: ['pizza', 'slice of pizza'], unitGrams: 120, defaultServing: 2, isCountBased: true, kcalPer100: 260, pPer100: 11, cPer100: 30, fPer100: 10 },
  { aliases: ['flat white', 'latte', 'cappuccino'], unitGrams: 250, defaultServing: 1, isCountBased: true, kcalPer100: 48, pPer100: 2.8, cPer100: 4, fPer100: 2.4 },
  { aliases: ['black coffee', 'americano', 'espresso', 'long black'], unitGrams: 200, defaultServing: 1, isCountBased: true, kcalPer100: 3, pPer100: 0.2, cPer100: 0.4, fPer100: 0 },
];

/**
 * Intelligent athletic NLP parser:
 * Identifies foods, quantities (grams, ounces, scoops, slices, counts),
 * looks up databases, and calculates exact macros.
 */
function parseSpokenMeal(speechText: string): ParsedMeal {
  const clean = speechText.trim().toLowerCase();
  if (!clean) {
    return { name: 'Quick Meal', calories: 350, protein: 25, carbs: 30, fats: 12 };
  }

  // Split speech by common conversational separators
  const segments = clean
    .replace(/\band\b|\bwith\b|\bplus\b|\b&\b|\b,\b/gi, '|')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  let totalKcal = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;
  const matchedNames: string[] = [];

  for (const segment of segments) {
    // 1. Try to extract explicit numbers & units
    let quantity = 1;
    let isExplicitGrams = false;

    // Grams / g match: e.g. "200g", "150 grams", "100 gram"
    const gramMatch = segment.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?|gr)\b/i);
    if (gramMatch) {
      quantity = parseFloat(gramMatch[1]);
      isExplicitGrams = true;
    } else {
      // Oz match: e.g. "8 oz", "6 ounces"
      const ozMatch = segment.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounces?)\b/i);
      if (ozMatch) {
        quantity = parseFloat(ozMatch[1]) * 28.35;
        isExplicitGrams = true;
      } else {
        // Scoops / slices / cups / pieces / count
        const countMatch = segment.match(
          /(\d+(?:\.\d+)?)\s*(?:scoops?|slices?|cups?|pieces?|eggs?|servings?|bowls?)?\b/i
        );
        // Words to numbers (one, two, three, four, half)
        const wordNumberMap: Record<string, number> = {
          a: 1,
          an: 1,
          one: 1,
          two: 2,
          three: 3,
          four: 4,
          five: 5,
          six: 6,
          half: 0.5,
          double: 2,
          triple: 3,
        };

        for (const [w, val] of Object.entries(wordNumberMap)) {
          const wRegex = new RegExp(`\\b${w}\\b`, 'i');
          if (wRegex.test(segment)) {
            quantity = val;
            break;
          }
        }

        if (countMatch && !isNaN(parseFloat(countMatch[1]))) {
          quantity = parseFloat(countMatch[1]);
        }
      }
    }

    // 2. Find matching item in COMMON_NUTRITION_ITEMS
    let bestMatch: NutritionDensity | null = null;
    let bestAliasLength = 0;

    for (const item of COMMON_NUTRITION_ITEMS) {
      for (const alias of item.aliases) {
        if (segment.includes(alias) && alias.length > bestAliasLength) {
          bestMatch = item;
          bestAliasLength = alias.length;
        }
      }
    }

    if (bestMatch) {
      let gramsConsumed = 0;

      if (isExplicitGrams) {
        gramsConsumed = quantity;
      } else if (bestMatch.isCountBased) {
        gramsConsumed = quantity * bestMatch.unitGrams;
      } else {
        gramsConsumed = bestMatch.defaultServing * (quantity > 0 && quantity <= 10 ? quantity : 1);
      }

      const factor = gramsConsumed / 100;
      const kcal = Math.round(bestMatch.kcalPer100 * factor);
      const p = Math.round(bestMatch.pPer100 * factor * 10) / 10;
      const c = Math.round(bestMatch.cPer100 * factor * 10) / 10;
      const f = Math.round(bestMatch.fPer100 * factor * 10) / 10;

      totalKcal += kcal;
      totalP += p;
      totalC += c;
      totalF += f;

      const mainAlias = bestMatch.aliases[0];
      const capitalized = mainAlias.charAt(0).toUpperCase() + mainAlias.slice(1);
      const label = isExplicitGrams
        ? `${Math.round(gramsConsumed)}g ${capitalized}`
        : bestMatch.isCountBased && quantity > 1
        ? `${quantity}x ${capitalized}`
        : capitalized;
      matchedNames.push(label);
    } else {
      // 3. Fallback: Search fallback regional database for a match
      const fallbackResults = getRegionalFallbackFoods('AU', 'protein', segment);
      if (fallbackResults.length > 0) {
        const item = fallbackResults[0];
        totalKcal += item.calories;
        totalP += item.protein;
        totalC += item.carbs;
        totalF += item.fats;
        matchedNames.push(item.name);
      }
    }
  }

  // If nothing matched in detail, calculate a sensible balanced athletic meal estimate
  if (matchedNames.length === 0 || totalKcal === 0) {
    const rawCapitalized = speechText.trim().charAt(0).toUpperCase() + speechText.trim().slice(1);
    return {
      name: rawCapitalized || 'Voice Meal',
      calories: 420,
      protein: 35,
      carbs: 45,
      fats: 11,
      rawIngredients: [rawCapitalized],
    };
  }

  const combinedName = matchedNames.join(' + ');

  return {
    name: combinedName.length > 48 ? combinedName.slice(0, 45) + '...' : combinedName,
    calories: Math.max(10, Math.round(totalKcal)),
    protein: Math.max(0, Math.round(totalP * 10) / 10),
    carbs: Math.max(0, Math.round(totalC * 10) / 10),
    fats: Math.max(0, Math.round(totalF * 10) / 10),
    rawIngredients: matchedNames,
  };
}

export const VoiceScanModal: React.FC<VoiceScanModalProps> = ({
  isOpen,
  onClose,
  category = 'Meal',
  onConfirmFood,
}) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable parsed values
  const [parsedItem, setParsedItem] = useState<ParsedMeal | null>(null);
  const [editName, setEditName] = useState('');
  const [editCalories, setEditCalories] = useState<number>(0);
  const [editProtein, setEditProtein] = useState<number>(0);
  const [editCarbs, setEditCarbs] = useState<number>(0);
  const [editFats, setEditFats] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop listening helper
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe ignore
      }
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsListening(false);
  }, []);

  // Analyze text and populate editable fields
  const handleAnalyzeText = useCallback((textToAnalyze: string) => {
    const trimmed = textToAnalyze.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    tactileEngine.triggerSelectionBuzz();

    setTimeout(() => {
      const result = parseSpokenMeal(trimmed);
      setParsedItem(result);
      setEditName(result.name);
      setEditCalories(result.calories);
      setEditProtein(result.protein);
      setEditCarbs(result.carbs);
      setEditFats(result.fats);
      setIsProcessing(false);
      tactileEngine.triggerSelectionBuzz();
    }, 300);
  }, []);

  // Start real phone microphone speech recognition
  const startListening = useCallback(async () => {
    tactileEngine.triggerSelectionBuzz();
    setPermissionError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
      setPermissionError('Speech recognition is not supported in this browser. You can type below.');
      return;
    }

    // Request direct microphone permission first for mobile reliability
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setPermissionError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        setIsListening(false);
        return;
      }
      // Continue even if getUserMedia fails (SpeechRecognition might still handle it on iOS Safari)
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setTranscript(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setPermissionError('Microphone permission blocked. Please allow mic access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // No speech detected, silently wait for user to speak
        } else {
          setPermissionError(`Microphone notice: ${event.error}. You can also type your meal below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setPermissionError('Could not start microphone. You can type your meal description below.');
    }
  }, []);

  // When modal opens, auto-request listening
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setIsListening(false);
      setIsProcessing(false);
      setParsedItem(null);
      setPermissionError(null);
      setIsEditing(false);
      return;
    }

    // Check support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setHasSpeechSupport(Boolean(SpeechRecognition));

    // Do not auto-prompt without user touch gesture on iOS/iPadOS to avoid permission denial crashes
    // User taps the pulse microphone button to initiate listening

    return () => {
      stopListening();
    };
  }, [isOpen, startListening, stopListening]);

  // When transcript updates and user pauses, auto-offer analysis if transcript is long enough
  useEffect(() => {
    if (!isListening && transcript.trim().length > 3 && !parsedItem) {
      handleAnalyzeText(transcript);
    }
  }, [isListening, transcript, parsedItem, handleAnalyzeText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] w-full p-4 shadow-xl relative space-y-3 text-center overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            stopListening();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.08] hover:bg-neutral-700 text-neutral-400 hover:text-white text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Metadata */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-o1-crimson animate-ping" />
            <span className="text-[10px] font-mono text-o1-crimson font-bold tracking-widest">
              Live Phone Microphone • {category.toUpperCase()}
            </span>
          </div>
          <h3 className="font-bold text-lg text-white tracking-tight">
            {isListening ? 'Listening to your voice...' : hasSpeechSupport ? 'Speak or Type Your Meal' : 'Type Your Meal'}
          </h3>
          <p className="text-xs text-neutral-400">
            {isListening
              ? 'Speak clearly into your phone microphone'
              : hasSpeechSupport
                ? 'Tap microphone to speak your meal details'
                : 'Voice input is not available on this device. Describe your meal below.'}
          </p>
        </div>

        {/* Pulsing Mic Interactive Indicator */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute w-24 h-24 rounded-full bg-o1-crimson/20 animate-ping duration-1000" />
                <span className="absolute w-20 h-20 rounded-full bg-o1-crimson/30 animate-pulse duration-700" />
              </>
            )}
            <button
              type="button"
              disabled={!hasSpeechSupport}
              onClick={() => {
                if (isListening) {
                  stopListening();
                  if (transcript.trim()) {
                    handleAnalyzeText(transcript);
                  }
                } else {
                  startListening();
                }
              }}
              title={!hasSpeechSupport ? 'Voice input unavailable' : isListening ? 'Tap to finish speaking' : 'Tap to start speaking'}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${
                isListening
                  ? 'bg-o1-crimson text-white shadow-red-600/40 ring-4 ring-red-400/40'
                  : 'bg-o1-well border border-white/[0.07] text-neutral-200 hover:border-o1-crimson'
              }`}
            >
              {isListening ? (
                <Mic className="w-7 h-7 animate-bounce" />
              ) : (
                <Mic className="w-7 h-7 text-o1-crimson" />
              )}
            </button>
          </div>

          {/* Status Label below mic */}
          <div className="mt-3 flex items-center gap-1.5 text-xs font-mono font-medium">
            {isListening ? (
              <span className="text-o1-crimson font-bold flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                Recording voice... Tap when done
              </span>
            ) : (
              <span className="text-neutral-400">
                {hasSpeechSupport ? 'Tap mic icon to talk' : 'Microphone unavailable'}
              </span>
            )}
          </div>
        </div>

        {/* Permission / Support Notice */}
        {permissionError && (
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="leading-snug">{permissionError}</span>
          </div>
        )}

        {/* Live Spoken Transcript / Text input */}
        <div className="space-y-2 text-left">
          <label className="text-[11px] font-bold tracking-wider text-neutral-400 flex items-center justify-between">
            <span>Voice Transcript</span>
            {transcript && (
              <button
                type="button"
                onClick={() => {
                  setTranscript('');
                  setParsedItem(null);
                }}
                className="text-[10px] text-neutral-400 hover:text-neutral-200 underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </label>

          <div className="relative">
            <input
              type="text"
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAnalyzeText(transcript);
                }
              }}
              placeholder={isListening ? 'Speaking...' : 'e.g. 200g chicken breast and 1 cup rice'}
              className="w-full h-11 px-3.5 pr-10 rounded-xl bg-black border border-white/[0.07] text-xs sm:text-sm font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson transition-colors"
            />
            {transcript && (
              <button
                type="button"
                onClick={() => handleAnalyzeText(transcript)}
                disabled={isProcessing}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-white/[0.08] text-white hover:bg-black transition-colors cursor-pointer"
                title="Analyze meal"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}
          </div>

          {/* Quick Voice Suggestions */}
          {!parsedItem && (
            <div className="pt-1">
              <span className="text-[10px] font-mono text-neutral-400 tracking-wider block mb-1.5">
                Quick Voice Prompts (tap to log):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '2 poached eggs with sourdough toast',
                  '200g chicken breast & 150g jasmine rice',
                  '1 scoop whey protein with banana',
                  'Sirloin steak 200g & sweet potato',
                ].map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setTranscript(phrase);
                      handleAnalyzeText(phrase);
                    }}
                    className="text-[11px] px-2 py-1 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-neutral-300 transition-colors cursor-pointer text-left"
                  >
                    &ldquo;{phrase}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Parsed Nutrition Preview & Editable Result */}
        {parsedItem && (
          <div className="p-4 rounded-2xl bg-o1-well border border-white/[0.07] text-left space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="font-bold text-xs text-white bg-black/50 border border-white/[0.07] rounded-xl px-2 py-1 w-full"
                />
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-xs sm:text-sm text-white truncate">
                    {editName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-neutral-400 hover:text-neutral-200 p-0.5 cursor-pointer"
                    title="Edit name"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <span className="font-mono text-sm font-black text-o1-crimson shrink-0">
                {editCalories} kcal
              </span>
            </div>

            {/* Macro Partitioning */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-black/40 p-2.5 rounded-xl border border-white/[0.07]">
              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-400 font-bold block">Protein</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editProtein}
                    onChange={(e) => setEditProtein(parseFloat(e.target.value) || 0)}
                    className="w-14 text-center font-bold text-xs text-o1-crimson bg-white/[0.08] rounded px-1"
                  />
                ) : (
                  <span className="font-bold text-white text-xs">
                    {editProtein}g
                  </span>
                )}
              </div>

              <div className="space-y-0.5 border-x border-white/[0.05]">
                <span className="text-[10px] text-neutral-400 font-bold block">Carbs</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editCarbs}
                    onChange={(e) => setEditCarbs(parseFloat(e.target.value) || 0)}
                    className="w-14 text-center font-bold text-xs text-amber-600 bg-white/[0.08] rounded px-1"
                  />
                ) : (
                  <span className="font-bold text-white text-xs">
                    {editCarbs}g
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-400 font-bold block">Fats</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editFats}
                    onChange={(e) => setEditFats(parseFloat(e.target.value) || 0)}
                    className="w-14 text-center font-bold text-xs text-sky-600 bg-white/[0.08] rounded px-1"
                  />
                ) : (
                  <span className="font-bold text-white text-xs">
                    {editFats}g
                  </span>
                )}
              </div>
            </div>

            {/* Log Button */}
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onConfirmFood(
                  editName || 'Voice Meal',
                  Math.round(editCalories),
                  Math.round(editProtein * 10) / 10,
                  Math.round(editCarbs * 10) / 10,
                  Math.round(editFats * 10) / 10
                );
                stopListening();
                onClose();
              }}
              className="w-full h-11 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Log to {category}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
