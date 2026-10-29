/**
 * Converts photo assets to WebP (quality 80) and removes the originals.
 *
 *   node scripts/convert-photos-to-webp.mjs [folder ...]
 *
 * Default folders: public/photos, public/reels/club, src/assets/images
 * Only .jpg / .jpeg files are converted. PNG files stay as they are because the app icon, the
 * web manifest and the native splash require PNG.
 * An original is deleted only after its WebP exists, decodes, and keeps the same dimensions.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const QUALITY = 80;
const folders = (
  process.argv.length > 2
    ? process.argv.slice(2)
    : ['public/photos', 'public/reels/club', 'src/assets/images']
).map((f) => path.resolve(f));

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jpe?g)$/i.test(entry.name)) yield full;
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(2);
let before = 0;
let after = 0;
let converted = 0;
const failures = [];

for (const folder of folders) {
  if (!fs.existsSync(folder)) continue;
  let folderBefore = 0;
  let folderAfter = 0;
  for (const file of walk(folder)) {
    const target = file.replace(/\.(jpe?g)$/i, '.webp');
    const originalBytes = fs.statSync(file).size;
    try {
      const source = await sharp(file).metadata();
      // rotate() applies any EXIF orientation so phones show the picture upright.
      await sharp(file).rotate().webp({ quality: QUALITY }).toFile(target);
      const out = await sharp(target).metadata();
      const rotated = (source.orientation ?? 1) >= 5;
      const expectW = rotated ? source.height : source.width;
      const expectH = rotated ? source.width : source.height;
      if (out.width !== expectW || out.height !== expectH) {
        throw new Error(`size changed ${expectW}x${expectH} -> ${out.width}x${out.height}`);
      }
      const newBytes = fs.statSync(target).size;
      fs.rmSync(file);
      folderBefore += originalBytes;
      folderAfter += newBytes;
      converted += 1;
    } catch (error) {
      fs.rmSync(target, { force: true });
      failures.push(`${path.relative(process.cwd(), file)}: ${error.message}`);
    }
  }
  before += folderBefore;
  after += folderAfter;
  console.log(
    `${path.relative(process.cwd(), folder).padEnd(22)} ${mb(folderBefore).padStart(7)} MB -> ${mb(folderAfter).padStart(6)} MB`,
  );
}

console.log(
  `\nConverted ${converted} files: ${mb(before)} MB -> ${mb(after)} MB (saved ${mb(before - after)} MB)`,
);
if (failures.length) {
  console.log(`\n${failures.length} kept as JPEG:`);
  for (const line of failures) console.log('  ' + line);
  process.exitCode = 1;
}
