/**
 * Oblivion 1 Fitness Club - Image Compression Utility
 * High-performance client-side image downscaling without fake pixel nutritional simulation.
 */

export async function compressAndAnalyzeImage(
  blob: Blob,
  maxDimension = 1024,
  quality = 0.75
): Promise<{ compressedBase64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.max(1, Math.round((height * maxDimension) / width));
          width = maxDimension;
        } else {
          width = Math.max(1, Math.round((width * maxDimension) / height));
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedBase64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
        resolve({ compressedBase64, mimeType: 'image/jpeg' });
      } else {
        resolve({ compressedBase64: '', mimeType: 'image/jpeg' });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ compressedBase64: '', mimeType: 'image/jpeg' });
    };

    img.src = objectUrl;
  });
}
