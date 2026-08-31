/**
 * Image Optimization Utilities for OFC Official
 * Dynamically adjusts remote image URLs (Unsplash, etc.) to optimal dimensions,
 * WebP format, and compression to maximize frame rates and minimize bandwidth.
 */

export function optimizeImageUrl(url: string | undefined | null, width = 800, quality = 75): string {
  if (!url || typeof url !== 'string') return '';

  // Handle Unsplash dynamic CDN resizing
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', width.toString());
      u.searchParams.set('q', quality.toString());
      return u.toString();
    } catch {
      // If parsing fails, fall back to string replacement or append
      return url.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, `q=${quality}`);
    }
  }

  return url;
}

/**
 * Thumbnail optimization for fast grid & list rendering
 */
export function optimizeThumbnailUrl(url: string | undefined | null): string {
  return optimizeImageUrl(url, 320, 65);
}

/**
 * Preload an image with low memory footprint
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (!src) return resolve();
    const img = new Image();
    img.decoding = 'async';
    img.src = optimizeImageUrl(src, 800, 75);
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}
