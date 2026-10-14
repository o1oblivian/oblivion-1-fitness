import { useEffect, useState } from 'react';

/** Mean relative luminance the dial reads well against; brighter photos are dimmed toward it. */
const TARGET_LUMINANCE = 0.16;
const MIN_FACTOR = 0.35;
/** Applied when the image can't be sampled (cross-origin wallpapers). */
const UNMEASURED_FACTOR = 0.6;
const SAMPLE = 24;

const cache = new Map<string, number>();

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Samples the centre of the image, where the dial sits. Null when the image can't be read (e.g. CORS). */
function measure(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (!url.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        const sw = img.naturalWidth * 0.7;
        const sh = img.naturalHeight * 0.7;
        ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, SAMPLE, SAMPLE);
        const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * channel(data[i]) + 0.7152 * channel(data[i + 1]) + 0.0722 * channel(data[i + 2]);
        }
        resolve(sum / (data.length / 4));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Multiplier (MIN_FACTOR..1) applied on top of the athlete's brightness setting. */
export function useWallpaperAutoDim(url: string | undefined): number {
  const [factor, setFactor] = useState(() => (url && cache.has(url) ? cache.get(url)! : 1));

  useEffect(() => {
    if (!url) return;
    const known = cache.get(url);
    if (known !== undefined) {
      setFactor(known);
      return;
    }
    let cancelled = false;
    void measure(url).then((luminance) => {
      const next = luminance == null
        ? UNMEASURED_FACTOR
        : luminance <= TARGET_LUMINANCE ? 1 : Math.max(MIN_FACTOR, TARGET_LUMINANCE / luminance);
      cache.set(url, next);
      if (!cancelled) setFactor(next);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return factor;
}
