/**
 * Oblivion 1 Fitness Club - Bluetooth LE types.
 * Sensors are read-only: the app subscribes to the standard Heart Rate Measurement
 * characteristic for beat-to-beat intervals (HRV) and never writes to a device.
 */

export const MAX_BLE_DEVICES = 2;

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  /** Live RMSSD from this sensor, or null until enough clean beats have arrived. */
  hrvMs: number | null;
  /** False once the sensor has streamed without beat intervals, so it cannot give HRV. */
  sendsBeatIntervals: boolean | null;
}

export type BluetoothStateChangeCallback = (devices: BluetoothDeviceInfo[], error?: string) => void;

export interface BleConnectResult {
  success: boolean;
  device?: { id: string; name: string };
  error?: string;
  /** The person closed the system picker; not an error worth showing. */
  cancelled?: boolean;
}

/** Called with each Heart Rate Measurement: beat intervals in ms, or null when the packet carries none. */
export type BeatIntervalsHandler = (deviceId: string, intervalsMs: number[] | null) => void;

export interface BleDriver {
  isSupported(): boolean;
  connect(
    onBeats: BeatIntervalsHandler,
    onDisconnect: (deviceId: string) => void,
    connectedIds: string[],
  ): Promise<BleConnectResult>;
  disconnect(deviceId: string): Promise<void>;
}

// Standard Bluetooth SIG 16-bit UUIDs in 128-bit form.
export const BLE_UUIDS = {
  HEART_RATE_SERVICE: '0000180d-0000-1000-8000-00805f9b34fb',
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
} as const;

/**
 * Heart Rate Measurement (0x2A37): flags, heart rate (8 or 16 bit), optional energy expended,
 * then optional RR intervals in 1/1024 s. Returns the intervals in ms, or null when absent.
 */
export function parseBeatIntervalsMs(value: DataView): number[] | null {
  if (value.byteLength < 2) return null;
  const flags = value.getUint8(0);
  if (!(flags & 0x10)) return null;
  let offset = flags & 0x01 ? 3 : 2;
  if (flags & 0x08) offset += 2;
  const intervals: number[] = [];
  for (; offset + 1 < value.byteLength; offset += 2) {
    intervals.push(Math.round((value.getUint16(offset, true) * 1000) / 1024));
  }
  return intervals;
}

export function isPickerCancel(err: unknown): boolean {
  const text = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  return (
    text.includes('cancel') ||
    text.includes('user denied') ||
    text.includes('no device selected') ||
    text.includes('notfounderror')
  );
}
