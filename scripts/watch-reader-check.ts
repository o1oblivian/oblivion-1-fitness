/**
 * Sends a watch photo straight to Gemini with the production prompt and prints the raw reply, then
 * shows what the Tesseract backup reads from the same file. Nothing here is mocked.
 *
 *   npx tsx scripts/watch-reader-check.ts <image path> [<image path> ...]
 */
import 'dotenv/config';
import dotenv from 'dotenv';
import fs from 'node:fs';
import { generateContentWithFallback, getGenAI, QUICK_READ_THINKING } from '../server/lib/gemini';
import { CARDIO_TELEMETRY_PROMPT } from '../server/lib/cardioTelemetryPrompt';
import { recognizeTelemetryFromBuffer } from '../src/services/ocrTelemetryParser';

dotenv.config({ path: '.env.local', override: true });

async function check(path: string): Promise<void> {
  console.log(`\n==== ${path}`);
  const buffer = fs.readFileSync(path);
  console.log(`bytes: ${buffer.length}`);

  const genAI = getGenAI();
  if (!genAI) {
    console.log('GEMINI: no API key loaded, cannot call Gemini.');
  } else {
    const started = Date.now();
    const response = await generateContentWithFallback(
      genAI,
      [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: buffer.toString('base64') } },
            { text: CARDIO_TELEMETRY_PROMPT },
          ],
        },
      ],
      { responseMimeType: 'application/json', thinkingConfig: QUICK_READ_THINKING },
      { attemptTimeoutMs: 24_000, budgetMs: 26_000, hedgeAfterMs: 6_000 },
    );
    console.log(`GEMINI raw reply (${Date.now() - started} ms):`);
    console.log(response.text);
  }

  const ocr = await recognizeTelemetryFromBuffer(buffer).catch((err: unknown) => `error: ${err}`);
  console.log('TESSERACT backup read:');
  console.log(JSON.stringify(ocr));
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('Pass at least one image path.');
  process.exit(1);
}
for (const path of paths) await check(path);
process.exit(0);
