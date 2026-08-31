// Web Bluetooth API type declarations
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: any): Promise<BluetoothDevice>;
    };
  }
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: EventListener): void;
  }
  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  }
  interface BluetoothRemoteGATTService {
    uuid: string;
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }
  interface BluetoothRemoteGATTCharacteristic {
    value: DataView | null;
    readValue(): Promise<DataView>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: string, listener: EventListener): void;
  }
}

export interface BLEDevice {
  id: string;
  name: string;
  gattServer: BluetoothRemoteGATTServer | null;
  nativeDevice: BluetoothDevice;
  battery: number | null;
  heartRate: number | null;
  status: 'connected' | 'disconnected';
  services: string[];
  connectedAt: number;
}

export interface StoredDevice {
  id: string;
  name: string;
  type?: 'ble' | 'virtual';
  services: string[];
  connectedAt: number;
}

const STORAGE_KEY = 'o1fc_paired_devices';

export function getStoredDevices(): StoredDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function storeDevice(device: StoredDevice): void {
  const existing = getStoredDevices().filter((d) => d.id !== device.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([device, ...existing]));
}

export function removeStoredDevice(id: string): void {
  const existing = getStoredDevices().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator && typeof navigator.bluetooth?.requestDevice === 'function';
}

export async function scanFitnessDevices(): Promise<BluetoothDevice> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth is not supported on this browser/platform.');
  }

  // Use acceptAllDevices with all fitness optionalServices to maximize compatibility
  // (many wearables advertise with proprietary vendor UUIDs or names rather than standard 0x180D in the initial adv packet)
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      'battery_service',
      'device_information',
      'heart_rate',
      'cycling_power',
      'cycling_speed_and_cadence',
      'running_speed_and_cadence',
      'fitness_machine',
      'weight_scale',
      'health_thermometer',
    ],
  });

  return device;
}

export async function scanAllDevices(): Promise<BluetoothDevice> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth is not supported on this browser/platform.');
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      'battery_service',
      'device_information',
      'heart_rate',
      'cycling_power',
      'running_speed_and_cadence',
      'cycling_speed_and_cadence',
      'fitness_machine',
      'weight_scale',
      'health_thermometer',
    ],
  });

  return device;
}

export async function connectToDevice(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> {
  if (!device.gatt) {
    throw new Error('GATT not available on this device.');
  }
  const server = await device.gatt.connect();
  return server;
}

export async function readBatteryLevel(server: BluetoothRemoteGATTServer): Promise<number | null> {
  try {
    const service = await server.getPrimaryService('battery_service');
    const characteristic = await service.getCharacteristic('battery_level');
    const value = await characteristic.readValue();
    return value.getUint8(0);
  } catch {
    return null;
  }
}

export async function subscribeHeartRate(
  server: BluetoothRemoteGATTServer,
  onReading: (bpm: number) => void
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  try {
    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic('heart_rate_measurement');
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = (event.target as unknown as BluetoothRemoteGATTCharacteristic).value;
      if (!value) return;
      const flags = value.getUint8(0);
      const is16bit = flags & 0x01;
      const bpm = is16bit ? value.getUint16(1, true) : value.getUint8(1);
      onReading(bpm);
    });
    await characteristic.startNotifications();
    return characteristic;
  } catch {
    return null;
  }
}

export function disconnectDevice(device: BluetoothDevice): void {
  if (device.gatt?.connected) {
    device.gatt.disconnect();
  }
}

export function onDeviceDisconnected(
  device: BluetoothDevice,
  callback: () => void
): void {
  device.addEventListener('gattserverdisconnected', callback);
}

export function getAvailableServices(server: BluetoothRemoteGATTServer): Promise<string[]> {
  return server.getPrimaryServices().then((services) =>
    services.map((s) => s.uuid)
  ).catch(() => []);
}
