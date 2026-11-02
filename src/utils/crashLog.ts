const CRASH_KEY = 'o1fc_last_crash_v1';

function crashLogEnabled(): boolean {
  try {
    const raw = localStorage.getItem('o1fc_production_settings_v3');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    if (typeof parsed.crashReports === 'boolean') return parsed.crashReports;
    if (typeof parsed.publicTelemetry === 'boolean') return parsed.publicTelemetry;
    return true;
  } catch {
    return true;
  }
}

export function recordLocalCrash(error: Error, componentStack?: string): void {
  if (!crashLogEnabled()) return;
  try {
    localStorage.setItem(
      CRASH_KEY,
      JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack || '',
        componentStack: componentStack || '',
        at: new Date().toISOString(),
      }),
    );
  } catch (err) {
    console.warn('[crashLog] Could not store the crash report (storage full)', err);
  }
}

export function clearLocalCrash(): void {
  try {
    localStorage.removeItem(CRASH_KEY);
  } catch (err) {
    console.warn('[crashLog] Could not clear the stored crash report', err);
  }
}
