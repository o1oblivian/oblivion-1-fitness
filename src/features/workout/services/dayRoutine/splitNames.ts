/**
 * Format split name into a short title-case pill (e.g. "Push A", "Hyper", "Legs").
 */
export const formatConciseSplitName = (name: string): string => {
  if (!name) return 'Rest';
  const clean = name.replace(/\s*\(.*?\)/g, '').trim();
  const upper = clean.toUpperCase();
  if (upper.includes('HYROX') || upper.includes('HYPER')) return 'Hyper';
  if (upper.includes('REST') || upper.includes('RECOVERY') || upper.includes('RESTORATION'))
    return 'Rest';
  if (upper.includes('PUSH A')) return 'Push A';
  if (upper.includes('PULL A')) return 'Pull A';
  if (upper.includes('LEGS A')) return 'Legs A';
  if (upper.includes('PUSH B')) return 'Push B';
  if (upper.includes('PULL B')) return 'Pull B';
  if (upper.includes('LEGS B')) return 'Legs B';
  if (upper === 'PUSH') return 'Push';
  if (upper === 'PULL') return 'Pull';
  if (upper === 'LEGS') return 'Legs';
  if (clean.length > 8) {
    const firstWord = clean.split(' ')[0];
    const clipped = firstWord.length <= 8 ? firstWord : firstWord.substring(0, 8);
    return clipped.charAt(0).toUpperCase() + clipped.slice(1).toLowerCase();
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};
