/**
 * Compresses every reel video in place with the bundled ffmpeg (no system install needed).
 *
 *   node scripts/compress-reels.mjs [folder]      default folder: public/reels/club
 *
 * The encode is: H.264, CRF 28, slow preset, AAC 128k, fast-start, never wider than 1080p.
 * A file is replaced only when the new one is smaller and has the same length; otherwise the
 * original stays. Files this script already compressed are tagged and skipped, so it is safe to
 * run again without losing quality a second time.
 */
import ffmpegPath from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MARKER = 'o1fc-compressed';
const folder = path.resolve(process.argv[2] ?? 'public/reels/club');

if (!ffmpegPath) {
  console.error('ffmpeg-static has no binary for this platform.');
  process.exit(1);
}

/** ffmpeg prints stream info to stderr when run with only an input, and exits non-zero. */
function probe(file) {
  const out = spawnSync(ffmpegPath, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr;
  const dur = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(out);
  const seconds = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : null;
  const size = /Video:.*?,\s*(\d{2,5})x(\d{2,5})/.exec(out);
  return {
    seconds,
    width: size ? Number(size[1]) : null,
    height: size ? Number(size[2]) : null,
    tagged: out.includes(MARKER),
  };
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
const files = fs
  .readdirSync(folder)
  .filter((name) => name.toLowerCase().endsWith('.mp4'))
  .sort();

if (files.length === 0) {
  console.log(`No .mp4 files in ${folder}`);
  process.exit(0);
}

let before = 0;
let after = 0;
const rows = [];

for (const name of files) {
  const file = path.join(folder, name);
  const temp = path.join(folder, `.${name}.compressing.mp4`);
  const originalBytes = fs.statSync(file).size;
  before += originalBytes;
  const source = probe(file);

  if (source.tagged) {
    after += originalBytes;
    rows.push(
      `${name.padEnd(22)} ${mb(originalBytes).padStart(7)} MB  already compressed, skipped`,
    );
    continue;
  }

  const started = Date.now();
  const run = spawnSync(
    ffmpegPath,
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      file,
      '-vcodec',
      'libx264',
      '-crf',
      '28',
      '-preset',
      'slow',
      // Same as scale=-2:1080, but a clip shorter than 1080 lines is never stretched up.
      '-vf',
      'scale=-2:min(1080\\,ih)',
      '-pix_fmt',
      'yuv420p',
      '-acodec',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      '-metadata',
      `comment=${MARKER}`,
      temp,
    ],
    { encoding: 'utf8' },
  );

  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  if (run.status !== 0 || !fs.existsSync(temp)) {
    fs.rmSync(temp, { force: true });
    after += originalBytes;
    rows.push(
      `${name.padEnd(22)} ${mb(originalBytes).padStart(7)} MB  FAILED, original kept: ${(run.stderr || '').trim().slice(0, 120)}`,
    );
    continue;
  }

  const result = probe(temp);
  const newBytes = fs.statSync(temp).size;
  const sameLength =
    source.seconds !== null &&
    result.seconds !== null &&
    Math.abs(source.seconds - result.seconds) < 0.5;
  if (newBytes < originalBytes * 0.98 && sameLength) {
    fs.renameSync(temp, file);
    after += newBytes;
    const pct = Math.round((1 - newBytes / originalBytes) * 100);
    rows.push(
      `${name.padEnd(22)} ${mb(originalBytes).padStart(7)} MB -> ${mb(newBytes).padStart(6)} MB  -${pct}%  ${source.width}x${source.height} -> ${result.width}x${result.height}  ${result.seconds?.toFixed(1)}s  (${seconds}s)`,
    );
  } else {
    fs.rmSync(temp, { force: true });
    after += originalBytes;
    rows.push(
      `${name.padEnd(22)} ${mb(originalBytes).padStart(7)} MB  kept original (new ${mb(newBytes)} MB, length ${sameLength ? 'ok' : 'differs'})`,
    );
  }
  console.log(rows[rows.length - 1]);
}

console.log('\n' + rows.join('\n'));
console.log(
  `\nTOTAL ${mb(before)} MB -> ${mb(after)} MB  (saved ${mb(before - after)} MB, ${Math.round((1 - after / before) * 100)}%)`,
);
