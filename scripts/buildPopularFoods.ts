/**
 * Builds the bundled "Top 100" food list for every country in the country picker.
 *
 *   1. A model ranks the foods people in that country log most and words each the way USDA names it.
 *   2. Every number is read from a local copy of USDA FoodData Central (Foundation + SR Legacy).
 *      A food with no close USDA record is dropped, never estimated.
 *   3. The first 100 that matched are written to src/data/popularFoods/<CC>.json.
 *
 * Get the USDA files once (they are not kept in the repo):
 *   https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip
 *   https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2025-04-24.zip
 * and unzip both into one folder.
 *
 * Run:  npx tsx scripts/buildPopularFoods.ts --usda <folder> [--only AU,US] [--force]
 * Needs GEMINI_API_KEY in .env. Countries that already have a file are skipped unless --force is given.
 */
import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { generateContentWithFallback, getGenAI, parseGeminiJson } from '../server/lib/gemini';
import {
  REQUEST_COUNT,
  buildPopularPrompt,
  parsePopularDrafts,
  type MarketName,
  type PopularDraft,
} from '../server/lib/popularFoods';
import {
  bestMatch,
  indexRecords,
  type IndexedRecord,
  type UsdaRecord,
} from '../server/lib/usdaMatch';
import { GLOBAL_MARKET, POPULAR_COUNT, type PopularFood } from '../shared/popularFoods';

const OUT_DIR = resolve('src/data/popularFoods');
const COUNTRY_SOURCE = resolve('src/features/fuel/components/ClientCountryMarketModal.tsx');
const PARALLEL = 4;
/** A list shorter than this is not written; the app falls back to the world list instead. */
const MIN_ACCEPTED = 80;

interface FdcNutrientRow {
  nutrient?: { number?: string };
  amount?: number;
}
interface FdcFoodRow {
  fdcId: number;
  description: string;
  foodNutrients?: FdcNutrientRow[];
}

function nutrientAmount(food: FdcFoodRow, numbers: string[]): number | null {
  for (const number of numbers) {
    const row = food.foodNutrients?.find((n) => n.nutrient?.number === number);
    if (row && typeof row.amount === 'number' && row.amount >= 0) return row.amount;
  }
  return null;
}

function recordOf(food: FdcFoodRow, dataType: UsdaRecord['dataType']): UsdaRecord | null {
  const calories = nutrientAmount(food, ['208', '957', '958']);
  const protein = nutrientAmount(food, ['203']);
  const fats = nutrientAmount(food, ['204']);
  const carbs = nutrientAmount(food, ['205']);
  if (calories === null || protein === null || fats === null || carbs === null) return null;
  return {
    id: `usda-${food.fdcId}`,
    description: food.description,
    dataType,
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fats: Math.round(fats * 10) / 10,
  };
}

function loadUsda(dir: string): IndexedRecord[] {
  const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
  const records: UsdaRecord[] = [];
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
      SRLegacyFoods?: FdcFoodRow[];
      FoundationFoods?: FdcFoodRow[];
    };
    for (const food of parsed.SRLegacyFoods ?? []) {
      const record = recordOf(food, 'SR Legacy');
      if (record) records.push(record);
    }
    for (const food of parsed.FoundationFoods ?? []) {
      const record = recordOf(food, 'Foundation');
      if (record) records.push(record);
    }
  }
  if (records.length < 5000) throw new Error(`Only ${records.length} USDA records found in ${dir}`);
  console.log(`USDA records loaded: ${records.length}`);
  return indexRecords(records);
}

function readMarkets(): MarketName[] {
  const source = readFileSync(COUNTRY_SOURCE, 'utf8');
  const markets: MarketName[] = [];
  for (const m of source.matchAll(/code: '([A-Z]{2})', name: (?:'([^']+)'|"([^"]+)")/g)) {
    markets.push({ code: m[1], name: m[2] ?? m[3] });
  }
  return markets;
}

async function askModel(market: MarketName | null, exclude: string[]): Promise<PopularDraft[]> {
  const genAI = getGenAI();
  if (!genAI) throw new Error('GEMINI_API_KEY is not set');
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await generateContentWithFallback(
        genAI,
        [{ role: 'user', parts: [{ text: buildPopularPrompt(market, exclude) }] }],
        { responseMimeType: 'application/json', temperature: 0.2 },
      );
      const drafts = parsePopularDrafts(parseGeminiJson(response.text || ''));
      if (drafts.length >= 30) return drafts;
      lastError = new Error(`only ${drafts.length} usable foods`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error('The model did not answer');
}

/** The USDA record must be in the same range as the model's own estimate, or it is a different food. */
function agrees(usdaKcal: number, estimate: number | null): boolean {
  if (estimate === null) return true;
  return Math.abs(usdaKcal - estimate) <= Math.max(25, estimate * 0.35);
}

function matchDrafts(
  drafts: PopularDraft[],
  index: IndexedRecord[],
  taken: Set<string>,
  rows: PopularFood[],
  dropped: string[],
): void {
  for (const draft of drafts) {
    if (rows.length >= POPULAR_COUNT) return;
    const found = bestMatch(draft.usda, index) ?? bestMatch(draft.name, index);
    if (!found || taken.has(found.record.id)) {
      dropped.push(draft.name);
      continue;
    }
    if (!agrees(found.record.calories, draft.kcal)) {
      dropped.push(draft.name);
      continue;
    }
    taken.add(found.record.id);
    rows.push({
      id: found.record.id,
      name: draft.name,
      cat: draft.cat,
      kcal: found.record.calories,
      protein: found.record.protein,
      carbs: found.record.carbs,
      fats: found.record.fats,
    });
  }
}

async function buildFor(
  code: string,
  market: MarketName | null,
  index: IndexedRecord[],
): Promise<{ rows: PopularFood[]; dropped: string[] }> {
  const rows: PopularFood[] = [];
  const dropped: string[] = [];
  const taken = new Set<string>();
  const first = await askModel(market, []);
  matchDrafts(first, index, taken, rows, dropped);
  if (rows.length < POPULAR_COUNT) {
    try {
      const named = new Set(first.map((d) => d.name.toLowerCase()));
      const more = (
        await askModel(
          market,
          first.map((d) => d.name),
        )
      ).filter((d) => !named.has(d.name.toLowerCase()));
      matchDrafts(more, index, taken, rows, dropped);
    } catch (err) {
      console.warn(`[${code}] top-up skipped: ${err instanceof Error ? err.message : err}`);
    }
  }
  return { rows, dropped };
}

function arg(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

async function main(): Promise<void> {
  const usdaDir = arg('usda');
  if (!usdaDir) throw new Error('Pass --usda <folder with the two unzipped USDA json files>');
  const only = arg('only')
    ?.split(',')
    .map((c) => c.trim().toUpperCase());
  const force = process.argv.includes('--force');
  const index = loadUsda(resolve(usdaDir));
  mkdirSync(OUT_DIR, { recursive: true });

  const jobs: Array<{ code: string; market: MarketName | null }> = [
    { code: GLOBAL_MARKET, market: null },
    ...readMarkets().map((market) => ({ code: market.code, market })),
  ].filter((job) => !only || only.includes(job.code));

  const pending = jobs.filter((job) => force || !existsSync(join(OUT_DIR, `${job.code}.json`)));
  console.log(`${pending.length} of ${jobs.length} lists to build`);

  let next = 0;
  let written = 0;
  const failed: string[] = [];
  const worker = async () => {
    while (next < pending.length) {
      const job = pending[next++];
      try {
        const { rows, dropped } = await buildFor(job.code, job.market, index);
        if (rows.length < MIN_ACCEPTED) {
          failed.push(`${job.code} (${rows.length} foods)`);
          console.warn(`[${job.code}] only ${rows.length} foods matched, not written`);
          continue;
        }
        writeFileSync(join(OUT_DIR, `${job.code}.json`), `${JSON.stringify(rows)}\n`);
        written += 1;
        console.log(
          `[${job.code}] ${rows.length} foods, ${dropped.length} dropped (no USDA record close enough)`,
        );
      } catch (err) {
        failed.push(`${job.code} (${err instanceof Error ? err.message : 'error'})`);
        console.warn(`[${job.code}] failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  console.log(
    `Done. Written ${written}, failed ${failed.length}${failed.length ? `: ${failed.join(', ')}` : ''}`,
  );
  console.log(`(Asked the model for ${REQUEST_COUNT} foods per list.)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
