const ACRONYMS = new Set([
  'HRV',
  'BPM',
  'RPE',
  'RIR',
  '1RM',
  'O1FC',
  'ACWR',
  'DEXA',
  'BMI',
  'AM',
  'PM',
  'PR',
  'PB',
  'EMG',
  'CNS',
  'BLE',
  'USD',
  'AUD',
  'ACH',
  'RHR',
  'RM',
  'EMOM',
  'AMRAP',
  'HIIT',
  'LISS',
  'VO2',
  'KG',
  'KM',
  'LB',
  'LBS',
]);

const PROPER = new Map<string, string>([
  ['hyrox', 'Hyrox'],
  ['oblivion', 'Oblivion'],
  ['olympic', 'Olympic'],
]);

const SMALL = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by']);

function core(token: string): string {
  return token.replace(/[^A-Za-z0-9']/g, '');
}

function convertWord(raw: string, asTitle: boolean, isEdge: boolean): string {
  const stripped = core(raw);
  if (!stripped) return raw;
  const upper = stripped.toUpperCase();
  const lower = stripped.toLowerCase();
  let next = stripped;
  if (ACRONYMS.has(upper)) next = upper;
  else if (PROPER.has(lower)) next = PROPER.get(lower)!;
  else if (asTitle && !isEdge && SMALL.has(lower)) next = lower;
  else next = stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase();
  return raw.replace(stripped, next);
}

export function titleCase(input: string): string {
  if (!input) return input;
  const parts = input.split(/(\s+|[/|·•]+)/).filter((p) => p.length > 0);
  const words = parts.filter((p) => !/^[\s/|·•]+$/.test(p));
  let wordIdx = 0;
  return parts
    .map((part) => {
      if (/^[\s/|·•]+$/.test(part)) return part;
      const isEdge = wordIdx === 0 || wordIdx === words.length - 1;
      wordIdx += 1;
      return convertWord(part, true, isEdge);
    })
    .join('');
}

export function sentenceCase(input: string): string {
  if (!input) return input;
  const parts = input.split(/(\s+|[/|·•]+)/).filter((p) => p.length > 0);
  let first = true;
  return parts
    .map((part) => {
      if (/^[\s/|·•]+$/.test(part)) return part;
      const stripped = core(part);
      if (!stripped) return part;
      const upper = stripped.toUpperCase();
      const lower = stripped.toLowerCase();
      let next = stripped;
      if (ACRONYMS.has(upper)) next = upper;
      else if (PROPER.has(lower)) next = PROPER.get(lower)!;
      else if (first) {
        next = stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase();
        first = false;
      } else {
        next = stripped.toLowerCase();
        first = false;
      }
      return part.replace(stripped, next);
    })
    .join('');
}

/** Chrome (1–3 words) → title case. Longer supporting copy → sentence case. */
export function displayCase(input: string): string {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 4 || /[.!?]$/.test(input.trim())) return sentenceCase(input);
  return titleCase(input);
}
