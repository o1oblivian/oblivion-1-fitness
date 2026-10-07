/**
 * Unsplash API helper. All live requests must send the Client-ID access key.
 */
export function getUnsplashAccessKey(): string {
  return String(import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '').trim();
}

export function getUnsplashAuthHeader(): Record<string, string> {
  const key = getUnsplashAccessKey();
  return key ? { Authorization: `Client-ID ${key}` } : {};
}

export async function unsplashRequest<T = unknown>(path: string): Promise<T | null> {
  const key = getUnsplashAccessKey();
  if (!key) {
    console.warn('[Unsplash] VITE_UNSPLASH_ACCESS_KEY is missing.');
    return null;
  }

  const url = path.startsWith('http') ? path : `https://api.unsplash.com${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    },
  });

  if (!res.ok) {
    console.warn('[Unsplash] Request failed:', res.status, await res.text().catch(() => ''));
    return null;
  }

  return (await res.json()) as T;
}

export async function searchUnsplashPhotos(query: string, perPage = 20) {
  const encoded = encodeURIComponent(query);
  return unsplashRequest<{
    results?: Array<{
      id: string;
      description?: string | null;
      alt_description?: string | null;
      width?: number;
      height?: number;
      urls?: { regular?: string; full?: string; raw?: string; thumb?: string };
      user?: { name?: string };
    }>;
  }>(
    `/search/photos?query=${encoded}&per_page=${perPage}&orientation=landscape&content_filter=high&order_by=relevant`
  );
}
