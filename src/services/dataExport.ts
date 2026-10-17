import { Capacitor } from '@capacitor/core';

export type ExportResult = 'saved' | 'cancelled';

function isShareCancel(err: unknown): boolean {
  const text = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  return text.includes('cancel') || text.includes('abort');
}

/**
 * Hands a JSON file to the person. In the phone app the file is written to the app cache and the
 * system share sheet opens, so they choose where it goes; in a browser it downloads.
 */
export async function exportJsonFile(fileName: string, json: string): Promise<ExportResult> {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({ title: fileName, files: [uri] });
      return 'saved';
    } catch (err) {
      if (isShareCancel(err)) return 'cancelled';
      throw err;
    }
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'saved';
}
