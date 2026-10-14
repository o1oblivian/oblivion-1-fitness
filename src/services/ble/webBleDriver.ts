/**
 * Oblivion 1 Fitness Club - Web Bluetooth driver (desktop Chrome / Edge).
 * Read-only: subscribes to Heart Rate Measurement notifications and never writes to the sensor.
 */

import { BeatIntervalsHandler, BleConnectResult, BleDriver, isPickerCancel, parseBeatIntervalsMs } from './bleTypes';

interface WebGattCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<WebGattCharacteristic>;
  stopNotifications(): Promise<WebGattCharacteristic>;
}

interface WebBluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<{
      getPrimaryService(service: string): Promise<{ getCharacteristic(name: string): Promise<WebGattCharacteristic> }>;
    }>;
    disconnect(): void;
  };
}

interface WebBluetooth {
  requestDevice(options: { filters: { services: string[] }[] }): Promise<WebBluetoothDevice>;
}

export class WebBleDriver implements BleDriver {
  private devices = new Map<string, { device: WebBluetoothDevice; measurement: WebGattCharacteristic | null }>();

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public async connect(
    onBeats: BeatIntervalsHandler,
    onDisconnect: (deviceId: string) => void,
    connectedIds: string[],
  ): Promise<BleConnectResult> {
    if (!this.isSupported()) return { success: false, error: 'This browser has no Bluetooth support.' };
    let device: WebBluetoothDevice | null = null;
    try {
      const bluetooth = (navigator as Navigator & { bluetooth: WebBluetooth }).bluetooth;
      device = await bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
      if (!device?.gatt) return { success: false, cancelled: true };
      const id = device.id;
      if (connectedIds.includes(id)) return { success: false, error: 'That sensor is already connected.' };

      device.addEventListener('gattserverdisconnected', () => {
        this.devices.delete(id);
        onDisconnect(id);
      });
      const server = await device.gatt.connect();
      const measurement = await (await server.getPrimaryService('heart_rate')).getCharacteristic('heart_rate_measurement');
      measurement.addEventListener('characteristicvaluechanged', () => {
        if (measurement.value) onBeats(id, parseBeatIntervalsMs(measurement.value));
      });
      await measurement.startNotifications();
      this.devices.set(id, { device, measurement });
      return { success: true, device: { id, name: device.name || 'Heart rate sensor' } };
    } catch (err) {
      if (device?.gatt?.connected) device.gatt.disconnect();
      if (isPickerCancel(err)) return { success: false, cancelled: true };
      const message = err instanceof Error ? err.message : '';
      return { success: false, error: message || 'Could not connect to the sensor.' };
    }
  }

  public async disconnect(deviceId: string): Promise<void> {
    const entry = this.devices.get(deviceId);
    this.devices.delete(deviceId);
    if (!entry) return;
    await entry.measurement?.stopNotifications().catch(() => {});
    if (entry.device.gatt?.connected) entry.device.gatt.disconnect();
  }
}
