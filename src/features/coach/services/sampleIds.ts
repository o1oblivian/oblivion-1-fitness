/** Dev sample clients and preview rows. They must never be written to Supabase. */
export function isSampleId(id: unknown): boolean {
  return /^(preview|sample)-/.test(String(id ?? ''));
}
