import React, { useState, useRef, useEffect } from 'react';
import { DailyMeals, LoggedMealItem, FoodItem } from '../../types';
import { Mic, X, Check, Sparkles, Trash2, Clock, ChevronDown, Camera, Plus, Sunrise, Utensils, Moon, Coffee, Package } from 'lucide-react';
import { parseFoodVoiceInput, wordsToNumbers } from '../../utils/voiceParser';
import { matchFoodFromDB, extractQuantity, MatchedFood } from '../../utils/foodVoiceSearch';
import { FoodCategoryIcon } from '../FoodCategoryIcon';

interface DailyFoodMealLogsProps {
  dailyMeals: DailyMeals;
  totalIntakeCals: number;
  onOpenFoodModal: (meal: keyof DailyMeals) => void;
  onOpenScanModal: (meal: keyof DailyMeals) => void;
  onDeleteMealItem: (meal: keyof DailyMeals, id: string) => void;
  onAddDirectMealItem?: (meal: keyof DailyMeals, item: LoggedMealItem) => void;
  recentFoods?: LoggedMealItem[];
}

interface MatchedFoodDisplay {
  item: FoodItem;
  category: string;
  quantityGrams?: number;
  multiplier?: number;
}

export const DailyFoodMealLogs: React.FC<DailyFoodMealLogsProps> = ({
  dailyMeals,
  totalIntakeCals,
  onOpenFoodModal,
  onOpenScanModal,
  onDeleteMealItem,
  onAddDirectMealItem,
  recentFoods = [],
}) => {
  const [listeningMeal, setListeningMeal] = useState<keyof DailyMeals | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [matchedFoods, setMatchedFoods] = useState<MatchedFoodDisplay[]>([]);
  const [voiceHint, setVoiceHint] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceActiveRef = useRef(false);
  const lastProcessedRef = useRef('');
  const lastFinalRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buffer for accumulating final-result fragments into a single complete utterance.
  // Chrome fires multiple final events for one spoken sentence (e.g. "200" then "brown rice"),
  // so we must wait for a pause before processing the whole thing at once.
  const utteranceBufferRef = useRef<string[]>([]);
  const utteranceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const UTTERANCE_PAUSE_MS = 900;

  // Build a LoggedMealItem from a FoodItem DB match, scaling macros if quantity is given
  const foodItemToLogged = (food: FoodItem, quantityGrams?: number, multiplier?: number): LoggedMealItem => {
    const baseGrams = food.defaultServingGrams || 100;
    let actualGrams = baseGrams;
    let scale = 1;

    if (quantityGrams && quantityGrams > 0) {
      scale = quantityGrams / baseGrams;
      actualGrams = quantityGrams;
    } else if (multiplier && multiplier > 0) {
      scale = multiplier;
      actualGrams = baseGrams * multiplier;
    }

    const p = Math.round(food.p * scale * 10) / 10;
    const c = Math.round(food.c * scale * 10) / 10;
    const f = Math.round(food.f * scale * 10) / 10;
    const cals = Math.round(p * 4 + c * 4 + f * 9);

    return {
      id: 'voice_food_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: food.name,
      weight: actualGrams,
      p,
      c,
      f,
      cals,
    };
  };

  // Words that indicate a delete intent — never parsed as food
  const DELETE_TRIGGERS = ['delete', 'remove', 'drop', 'undo', 'clear', 'trash'];

  const cleanSpeech = (text: string): string =>
    text.toLowerCase().trim().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ').trim();

  // Returns true if the text is a delete trigger word (with or without a food name after it)
  const isDeleteCommand = (text: string): boolean => {
    const clean = cleanSpeech(wordsToNumbers(text));
    if (!clean) return false;
    return DELETE_TRIGGERS.some((t) => clean === t || clean.startsWith(`${t} `)) ||
      clean.startsWith('get rid of');
  };

  // Try to match a delete command against logged items. Returns true if handled (even if nothing found).
  const tryDeleteCommand = (meal: keyof DailyMeals, text: string): boolean => {
    const lower = cleanSpeech(wordsToNumbers(text));

    const deleteMatch = lower.match(/\b(?:delete|remove|drop|undo|clear|trash|get rid of)\s+(?:the\s+)?(?:last\s+)?(.+)/);
    if (!deleteMatch) {
      // Just the trigger word alone — wait for the food name
      setVoiceHint('Say the food name to delete (e.g. "chicken breast")');
      return true;
    }

    const targetName = deleteMatch[1].trim();

    // "delete last" — remove the most recent item in this meal
    if (/^(?:last|last item|last one|that last one)$/.test(targetName)) {
      const items = dailyMeals[meal] || [];
      if (items.length > 0) {
        const last = items[items.length - 1];
        onDeleteMealItem(meal, last.id);
        setVoiceHint(`Deleted: ${last.name}`);
        setMatchedFoods([]);
        setLiveTranscript('');
        lastFinalRef.current = '';
        return true;
      }
      setVoiceHint(`No items in ${meal} to delete`);
      return true;
    }

    // "delete everything" / "clear all" — remove all items in this meal
    if (/^(?:everything|all|all items|all of it|whole meal)$/.test(targetName)) {
      const items = dailyMeals[meal] || [];
      items.forEach((it) => onDeleteMealItem(meal, it.id));
      setVoiceHint(`Cleared all items from ${meal}`);
      setMatchedFoods([]);
      setLiveTranscript('');
      lastFinalRef.current = '';
      return true;
    }

    // Match the spoken food name against items already logged in this meal
    const items = dailyMeals[meal] || [];
    const targetWords = targetName.split(/\s+/).filter((w) => w.length > 1);

    let bestItem: LoggedMealItem | null = null;
    let bestScore = 0;

    for (const item of items) {
      const itemName = item.name.toLowerCase();
      let score = 0;
      for (const tw of targetWords) {
        if (itemName.includes(tw)) score += 10;
      }
      if (itemName === targetName) score += 50;
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }

    if (bestItem && bestScore >= 10) {
      onDeleteMealItem(meal, bestItem.id);
      setVoiceHint(`Deleted: ${bestItem.name}`);
      setMatchedFoods([]);
      setLiveTranscript('');
      lastFinalRef.current = '';
      return true;
    }

    // Search other meals in case the item is logged under a different meal
    for (const otherMeal of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      if (otherMeal === meal) continue;
      const otherItems = dailyMeals[otherMeal] || [];
      for (const item of otherItems) {
        const itemName = item.name.toLowerCase();
        let score = 0;
        for (const tw of targetWords) {
          if (itemName.includes(tw)) score += 10;
        }
        if (itemName === targetName) score += 50;
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
          if (bestScore >= 10) {
            onDeleteMealItem(otherMeal, item.id);
            setVoiceHint(`Deleted: ${item.name} (from ${otherMeal})`);
            setMatchedFoods([]);
            setLiveTranscript('');
            lastFinalRef.current = '';
            return true;
          }
        }
      }
    }

    setVoiceHint(`Couldn't find "${targetName}" in your food log`);
    return true;
  };

  // Process a final transcript: delete command check first, then DB match, then custom macros
  const processFoodVoice = (meal: keyof DailyMeals, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === lastProcessedRef.current) return;
    lastProcessedRef.current = trimmed;

    // DELETE CHECK FIRST: if the transcript is/starts with a delete trigger word,
    // handle it as a delete command and never log it as food.
    if (isDeleteCommand(trimmed)) {
      if (tryDeleteCommand(meal, trimmed)) return;
    }

    // MULTI-FOOD SPLIT: "200g brown rice and 300g chicken" → two separate items.
    // Split on " and " / " plus " / " also " / comma, but only if each fragment
    // looks like a food phrase (contains at least one letter word).
    const fragments = trimmed
      .split(/\s+(?:and|also|plus|then)\s+|,\s+/i)
      .map((f) => f.trim())
      .filter((f) => f.length >= 2);

    const foodFragments = fragments.filter((f) => /[a-z]{2,}/i.test(f));

    // If only one fragment (or fragments don't look like food), process as single item
    if (foodFragments.length <= 1) {
      processSingleFood(meal, trimmed);
      return;
    }

    // Multiple food phrases — process each one
    const addedNames: string[] = [];
    for (const fragment of foodFragments) {
      const result = processSingleFood(meal, fragment, true);
      if (result) addedNames.push(result);
    }
    if (addedNames.length > 0) {
      setVoiceHint(`Added ${addedNames.length} items: ${addedNames.join(', ')}`);
      setMatchedFoods([]);
      setLiveTranscript('');
      lastFinalRef.current = '';
    }
  };

  // Process a single food phrase. Returns the food name if added, or null if not.
  // silent=true suppresses individual voice hints (used for multi-food mode).
  const processSingleFood = (meal: keyof DailyMeals, text: string, silent = false): string | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const converted = wordsToNumbers(trimmed);

    // Try DB match first
    const matches = matchFoodFromDB(converted, 3);
    if (matches.length > 0 && matches[0].score >= 25) {
      const best = matches[0];
      const qty = extractQuantity(converted.toLowerCase());
      const logged = foodItemToLogged(best.item, qty.grams, qty.multiplier);
      if (onAddDirectMealItem) {
        onAddDirectMealItem(meal, logged);
      }
      if (!silent) {
        const qtyLabel = qty.grams ? ` ${qty.grams}g` : qty.multiplier ? ` x${qty.multiplier}` : '';
        setVoiceHint(`Added: ${best.item.name}${qtyLabel} (${logged.cals} kcal)`);
        setMatchedFoods([]);
        setLiveTranscript('');
        lastFinalRef.current = '';
      }
      return best.item.name;
    }

    // Show fuzzy matches if any (user can tap to confirm) — only in single mode
    if (matches.length > 0 && !silent) {
      const qty = extractQuantity(converted.toLowerCase());
      setMatchedFoods(matches.map((m) => ({
        item: m.item,
        category: m.category,
        quantityGrams: qty.grams,
        multiplier: qty.multiplier,
      })));
      setVoiceHint(`Found ${matches.length} matches — tap to add, or keep speaking`);
      return null;
    }

    // No DB match — try parsing as custom macros
    const parsed = parseFoodVoiceInput(converted);
    const firstItem = parsed.items[0];
    if (firstItem && firstItem.name.length >= 2) {
      const cleanName = cleanSpeech(firstItem.name);
      if (DELETE_TRIGGERS.includes(cleanName)) {
        if (!silent) {
          setVoiceHint(`Say a food name to add, or "delete [food name]" to remove`);
          setMatchedFoods([]);
        }
        return null;
      }
      const newItem: LoggedMealItem = {
        id: 'voice_food_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: firstItem.name,
        weight: firstItem.quantity ?? 0,
        p: 0,
        c: 0,
        f: 0,
        cals: 0,
      };
      if (onAddDirectMealItem) {
        onAddDirectMealItem(meal, newItem);
      }
      if (!silent) {
        setVoiceHint(`Added: ${firstItem.name}`);
        setLiveTranscript('');
        lastFinalRef.current = '';
      }
      return firstItem.name;
    }

    if (!silent) {
      setVoiceHint(`Didn't catch that — try "chicken breast" or "200 grams chicken"`);
    }
    return null;
  };

  const stopFoodVoice = () => {
    voiceActiveRef.current = false;
    // Flush any buffered utterance before stopping
    if (utteranceTimerRef.current) clearTimeout(utteranceTimerRef.current);
    const buffered = utteranceBufferRef.current.join(' ').trim();
    utteranceBufferRef.current = [];
    if (buffered && buffered !== lastProcessedRef.current && listeningMeal) {
      processFoodVoice(listeningMeal, buffered);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    recognitionRef.current = null;
    setListeningMeal(null);
    // Keep transcript and matches visible briefly so user can tap a match
    setTimeout(() => {
      setLiveTranscript('');
      setMatchedFoods([]);
      setVoiceHint('');
    }, 4000);
  };

  const startFoodVoice = (meal: keyof DailyMeals) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceHint('Voice recognition not supported on this browser/device');
      setTimeout(() => setVoiceHint(''), 3000);
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    voiceActiveRef.current = true;
    lastProcessedRef.current = '';
    lastFinalRef.current = '';
    utteranceBufferRef.current = [];
    if (utteranceTimerRef.current) clearTimeout(utteranceTimerRef.current);
    setLiveTranscript('');
    setMatchedFoods([]);
    setVoiceHint('Listening... say a food name to add, or "delete [food name]" to remove');
    setListeningMeal(meal);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimText = '';
        let newFinalFragments: string[] = [];

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            if (transcript) newFinalFragments.push(transcript);
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        // Accumulate final fragments into the utterance buffer
        if (newFinalFragments.length > 0) {
          utteranceBufferRef.current.push(...newFinalFragments);
        }

        // Build the live display from buffered finals + current interim
        const bufferedText = utteranceBufferRef.current.join(' ');
        const displayText = (bufferedText + ' ' + interimText).trim();
        if (displayText) {
          setLiveTranscript(displayText);
        }

        // Show live fuzzy matches as user speaks (debounced)
        if (displayText.trim().length >= 2) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            const interimConverted = wordsToNumbers(displayText.toLowerCase());
            const matches = matchFoodFromDB(interimConverted, 3);
            if (matches.length > 0 && matches[0].score >= 15) {
              const qty = extractQuantity(interimConverted);
              setMatchedFoods(matches.map((m) => ({
                item: m.item,
                category: m.category,
                quantityGrams: qty.grams,
                multiplier: qty.multiplier,
              })));
            } else if (matches.length === 0) {
              setMatchedFoods([]);
            }
          }, 250);
        }

        // Set / reset the pause timer. When the user stops speaking for UTTERANCE_PAUSE_MS,
        // we process the complete buffered utterance as a single food entry.
        if (utteranceTimerRef.current) clearTimeout(utteranceTimerRef.current);
        utteranceTimerRef.current = setTimeout(() => {
          const completeText = utteranceBufferRef.current.join(' ').trim();
          utteranceBufferRef.current = [];
          if (completeText && completeText !== lastProcessedRef.current) {
            processFoodVoice(meal, completeText);
          }
        }, UTTERANCE_PAUSE_MS);
      };

      recognition.onerror = (e: any) => {
        // 'no-speech' and 'aborted' are normal during continuous listening
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          voiceActiveRef.current = false;
          setVoiceHint('Microphone permission denied — check browser settings');
          setListeningMeal(null);
          return;
        }
        if (voiceActiveRef.current) {
          try { recognition.start(); } catch (err) {}
        }
      };

      recognition.onend = () => {
        // Flush buffered utterance before Chrome restarts
        if (utteranceTimerRef.current) clearTimeout(utteranceTimerRef.current);
        const buffered = utteranceBufferRef.current.join(' ').trim();
        if (buffered && buffered !== lastProcessedRef.current) {
          utteranceBufferRef.current = [];
          processFoodVoice(meal, buffered);
        }
        // Auto-restart if still in listening mode (Chrome stops after silence)
        if (voiceActiveRef.current) {
          try { recognition.start(); } catch (e) {}
        } else {
          setListeningMeal(null);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setListeningMeal(null);
      voiceActiveRef.current = false;
      setVoiceHint('Could not start microphone — check browser permissions');
      setTimeout(() => setVoiceHint(''), 3000);
    }
  };

  const toggleFoodVoice = (meal: keyof DailyMeals) => {
    if (listeningMeal === meal) {
      stopFoodVoice();
    } else {
      startFoodVoice(meal);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceActiveRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (utteranceTimerRef.current) clearTimeout(utteranceTimerRef.current);
    };
  }, []);

  const confirmMatchedFood = (meal: keyof DailyMeals, food: FoodItem, quantityGrams?: number, multiplier?: number) => {
    const logged = foodItemToLogged(food, quantityGrams, multiplier);
    if (onAddDirectMealItem) {
      onAddDirectMealItem(meal, logged);
    }
    setVoiceHint(`Added: ${food.name} (${logged.cals} kcal)`);
    setMatchedFoods([]);
    setLiveTranscript('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-[#000000] dark:text-white flex items-center gap-2 cursor-pointer select-none" onClick={() => setCollapsed(!collapsed)}>
          <span>Daily Food & Meal Logs</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide px-1.5 py-0.5 rounded-xl bg-[#1A1E1D] dark:bg-white/10 text-white shadow-2xs uppercase">
            {totalIntakeCals} kcal Logged
          </span>
          <button onClick={() => setCollapsed(!collapsed)} className="w-6 h-6 rounded-lg bg-[#F2F2F7] dark:bg-white/10 flex items-center justify-center cursor-pointer active:scale-90 transition-all">
            <ChevronDown className={`w-3.5 h-3.5 text-[#5A5F5D] dark:text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Voice status banner — shown when listening or recently stopped */}
      {(listeningMeal || liveTranscript || voiceHint || matchedFoods.length > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/20 border border-red-200 dark:border-red-500/20 rounded-2xl p-3 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${listeningMeal ? 'bg-red-500' : 'bg-red-200 dark:bg-red-800'}`}>
              <Mic className={`w-3.5 h-3.5 ${listeningMeal ? 'text-white' : 'text-red-600'}`} />
            </div>
            <div className="min-w-0 flex-1">
              {liveTranscript ? (
                <p className="text-xs font-mono font-bold text-red-700 dark:text-red-300 truncate">
                  "{liveTranscript}"
                </p>
              ) : voiceHint ? (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 truncate">{voiceHint}</p>
              ) : (
                <p className="text-xs font-bold text-red-600 dark:text-red-400">
                  {listeningMeal ? `Listening to ${listeningMeal}...` : ''}
                </p>
              )}
            </div>
            {listeningMeal && (
              <button
                onClick={stopFoodVoice}
                className="px-1.5 py-0.5 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors shrink-0"
              >
                Stop
              </button>
            )}
          </div>

          {/* Live fuzzy matches — tap to add */}
          {matchedFoods.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10.5px] sm:text-[11px] font-bold tracking-wide uppercase text-red-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Tap to add:
              </p>
              {matchedFoods.map((match, idx) => {
                const baseGrams = match.item.defaultServingGrams || 100;
                const scale = match.quantityGrams
                  ? match.quantityGrams / baseGrams
                  : match.multiplier
                  ? match.multiplier
                  : 1;
                const p = Math.round(match.item.p * scale * 10) / 10;
                const c = Math.round(match.item.c * scale * 10) / 10;
                const f = Math.round(match.item.f * scale * 10) / 10;
                const cals = Math.round(p * 4 + c * 4 + f * 9);
                const actualGrams = match.quantityGrams || (match.multiplier ? baseGrams * match.multiplier : baseGrams);
                return (
                  <button
                    key={idx}
                    onClick={() => confirmMatchedFood(listeningMeal || 'breakfast', match.item, match.quantityGrams, match.multiplier)}
                    className="w-full flex items-center gap-2.5 bg-white dark:bg-[#22262B] border border-red-200 dark:border-red-500/20 rounded-xl p-2 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/80/60 dark:border-zinc-700/60 shrink-0">
                      <FoodCategoryIcon category={match.category} name={match.item.name} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] sm:text-[15px] font-bold tracking-tight text-slate-900 dark:text-white truncate">{match.item.name}</p>
                      <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-gray-400">
                        {Math.round(actualGrams)}g · {cals} kcal · {p}p {c}c {f}f
                      </p>
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-red-500 group-hover:bg-red-600 flex items-center justify-center shrink-0 transition-colors">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!collapsed && (
      <div className="space-y-2">
        {(['breakfast', 'lunch', 'dinner', 'snack', 'drinks'] as const).map((meal) => {
          const items = dailyMeals[meal] || [];
          const mealCals = items.reduce((acc, i) => acc + i.cals, 0);

          const getMealIcon = () => {
            switch (meal) {
              case 'breakfast':
                return <Sunrise className="w-4 h-4 text-zinc-900 dark:text-white" />;
              case 'lunch':
                return <Utensils className="w-4 h-4 text-zinc-900 dark:text-white" />;
              case 'dinner':
                return <Moon className="w-4 h-4 text-zinc-900 dark:text-white" />;
              case 'drinks':
                return <Coffee className="w-4 h-4 text-zinc-900 dark:text-white" />;
              case 'snack':
              default:
                return <Package className="w-4 h-4 text-zinc-900 dark:text-white" />;
            }
          };

          const mealP = items.reduce((acc, i) => acc + i.p, 0);
          const mealC = items.reduce((acc, i) => acc + i.c, 0);
          const mealF = items.reduce((acc, i) => acc + i.f, 0);

          return (
            <div
              key={meal}
              className="bg-white dark:bg-[#13161A] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden text-slate-900 dark:text-white shadow-2xs"
            >
              <div className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                    {getMealIcon()}
                  </div>
                  <span className="font-bold text-[15px] sm:text-[16px] tracking-tight text-[#000000] dark:text-white capitalize truncate">
                    {meal}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-zinc-400 shrink-0">
                      ({items.length})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-medium text-[11px] sm:text-[12px] text-slate-700 dark:text-zinc-300">
                    {mealCals > 0 ? `${mealCals} kcal` : '0 kcal'}
                  </span>
                </div>
              </div>

                <div className="border-t border-slate-200 dark:border-white/10">
                  <div>
                  {items.length === 0 ? (
                    <div className="px-3 py-2 text-center bg-slate-50/50 dark:bg-white/[0.02]">
                      <p className="text-[11px] sm:text-[12px] font-medium text-slate-400 dark:text-zinc-500">
                        No items logged
                      </p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center px-3 py-2 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#13161A] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/80/60 dark:border-zinc-700/60 shrink-0">
                            <FoodCategoryIcon category={meal} name={item.name} className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[13.5px] sm:text-[14.5px] tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                              <span className="truncate">{item.name}</span>
                              <span className="text-[9.5px] font-mono font-bold tracking-wide text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 uppercase shrink-0">
                                {typeof item.weight === 'number'
                                  ? item.weight >= 1000
                                  ? `${item.weight / 1000}kg`
                                    : `${item.weight}g`
                                  : item.weight}
                              </span>
                            </div>
                            <div className="text-[10.5px] font-mono mt-0.5 flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                              <span className="text-red-500 dark:text-red-400 font-medium">{item.p}p</span>
                              <span className="text-slate-300 dark:text-zinc-600">•</span>
                              <span className="text-sky-500 dark:text-sky-400 font-medium">{item.c}c</span>
                              <span className="text-slate-300 dark:text-zinc-600">•</span>
                              <span className="text-amber-500 dark:text-amber-400 font-medium">{item.f}f</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-semibold text-[11px] sm:text-[12px] text-slate-900 dark:text-white">
                            {item.cals} kcal
                          </span>
                          <button
                            onClick={() => onDeleteMealItem(meal, item.id)}
                            className="w-6 h-6 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              {/* Meal-level macro breakdown */}
              {items.length > 0 && (
                <div className="px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/10 flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-900 dark:text-white font-bold">{Math.round(mealP)}p</span>
                  <span className="text-slate-600 dark:text-zinc-400">{Math.round(mealC)}c</span>
                  <span className="text-slate-600 dark:text-zinc-400">{Math.round(mealF)}f</span>
                  <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10">
                    <div className="bg-slate-900 dark:bg-white" style={{ width: `${(mealP / (mealP + mealC + mealF || 1)) * 100}%` }} />
                    <div className="bg-slate-500 dark:bg-zinc-400" style={{ width: `${(mealC / (mealP + mealC + mealF || 1)) * 100}%` }} />
                    <div className="bg-slate-300 dark:bg-zinc-600" style={{ width: `${(mealF / (mealP + mealC + mealF || 1)) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Compact action strip */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10 gap-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenFoodModal(meal)}
                    className="h-8 px-3 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 hover:border-zinc-400 transition-all cursor-pointer active:scale-95"
                    title={`Add item to ${meal}`}
                  >
                    <Plus className="w-3.5 h-3.5 text-red-500" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFoodVoice(meal)}
                    className={`h-8 w-8 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
                      listeningMeal === meal
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                        : 'bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Voice entry"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => onOpenScanModal(meal)}
                  className="h-8 w-8 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0"
                  title="Intel Meal & Barcode Scan"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
                </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
