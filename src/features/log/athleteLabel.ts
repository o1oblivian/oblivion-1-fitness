const PLACEHOLDER = new Set(['athlete', 'jordan vance', '@athlete', '@jordan.vance']);

export function athleteLabel(name?: string, handle?: string, buddyName?: string): string {
  const candidates = [name, buddyName, (handle || '').replace(/^@/, '')];
  for (const raw of candidates) {
    const value = (raw || '').trim();
    if (!value || PLACEHOLDER.has(value.toLowerCase())) continue;
    return value;
  }
  return '';
}
