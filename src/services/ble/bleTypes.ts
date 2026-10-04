/**
 * Oblivion 1 Fitness Club - Bluetooth LE Types and GATT UUIDs
 * Strict File Ceiling: < 140 lines
 */

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  lastHeartRate?: number;
  lastCadence?: number;
  serviceType: 'heart_rate' | 'speed_cadence' | 'generic';
}

export type BluetoothStateChangeCallback = (
  info: BluetoothDeviceInfo | null,
  error?: string
) => void;

export interface BleConnectResult {
  success: boolean;
  deviceName?: string;
  error?: string;
}

// Standard Bluetooth SIG 16-bit to 128-bit UUID format
export const BLE_UUIDS = {
  HEART_RATE_SERVICE: '0000180d-0000-1000-8000-00805f9b34fb',
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  CYCLING_SPEED_CADENCE_SERVICE: '00001816-0000-1000-8000-00805f9b34fb',
  CSC_MEASUREMENT: '00002a5b-0000-1000-8000-00805f9b34fb',
  RUNNING_SPEED_CADENCE_SERVICE: '00001814-0000-1000-8000-00805f9b34fb',
  RSC_MEASUREMENT: '00002a53-0000-1000-8000-00805f9b34fb',
} as const;

export function parseHeartRateValue(value: DataView): number {
  if (value.byteLength === 0) return 0;
  const flags = value.getUint8(0);
  const rate16Bits = flags & 0x1;
  if (rate16Bits && value.byteLength >= 3) {
    return value.getUint16(1, /*littleEndian=*/ true);
  } else if (value.byteLength >= 2) {
    return value.getUint8(1);
  }
  return 0;
}
