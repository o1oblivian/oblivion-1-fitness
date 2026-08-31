export interface ParsedVoiceSet {
  exerciseName?: string;
  sets?: number;
  reps?: number;
  weight?: number;
}

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100,
};

export function wordsToNumbers(text: string): string {
  let result = text;
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), String(num));
  }
  return result;
}

export interface ParsedFoodVoice {
  items: { name: string; quantity?: number; unit?: string }[];
}

export function parseFoodVoiceInput(text: string): ParsedFoodVoice {
  const converted = wordsToNumbers(text.toLowerCase().trim());
  const parts = converted.split(/\band\b|,|;/).map(s => s.trim()).filter(Boolean);

  const items = parts.map(part => {
    const qtyMatch = part.match(/^(\d+)\s*/);
    const quantity = qtyMatch ? parseInt(qtyMatch[1]) : undefined;
    const name = part.replace(/^\d+\s*/, '').replace(/\b(grams?|g|pieces?|servings?|ml)\b/gi, '').trim();
    const unitMatch = part.match(/\b(grams?|g|pieces?|servings?|ml)\b/i);
    return { name: name || part, quantity, unit: unitMatch?.[0] };
  });

  return { items: items.filter(i => i.name.length > 1) };
}

export function parseVoiceInput(text: string): ParsedVoiceSet {
  const converted = wordsToNumbers(text.toLowerCase().trim());

  const setMatch = converted.match(/(\d+)\s*sets?/i);
  const repMatch = converted.match(/(\d+)\s*reps?/i);
  const weightMatch = converted.match(/(\d+)\s*(?:kg|kilos?|pounds?|lbs?)/i);

  const namePart = converted
    .replace(/\d+\s*sets?/i, '')
    .replace(/\d+\s*reps?/i, '')
    .replace(/\d+\s*(?:kg|kilos?|pounds?|lbs?)/i, '')
    .replace(/at|@|for|with/gi, '')
    .trim();

  return {
    exerciseName: namePart || undefined,
    sets: setMatch ? parseInt(setMatch[1]) : undefined,
    reps: repMatch ? parseInt(repMatch[1]) : undefined,
    weight: weightMatch ? parseInt(weightMatch[1]) : undefined,
  };
}
