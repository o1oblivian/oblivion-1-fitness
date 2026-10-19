/**
 * Oblivion 1 Fitness Club - Native Bluetooth driver (iOS & Android), via @capacitor-community/bluetooth-le.
 * Read-only: subscribes to Heart Rate Measurement notifications and never writes to the sensor.
 */

import { Capacitor } from '@capacitor/core';
import { withNativeTimeout } from '../../utils/nativeTimeout';
import type { BleClientInterface } from '@capacitor-community/bluetooth-le';
import {
  BLE_UUIDS,
  BeatIntervalsHandler,
  BleConnectResult,
  BleDriver,
  isPickerCancel,
  parseBeatIntervalsMs,
} from './bleTypes';

export class NativeBleDriver implements BleDriver {
  private client: BleClientInterface | null = null;
  private initialized = false;

  public isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  /** Boxed on purpose: a plugin object returned straight from an async function is awaited as a promise. */
  private async ready(): Promise<{ client: BleClientInterface } | null> {
    if (!this.isSupported()) return null;
    if (!this.client) {
      try {
        this.client = (await import('@capacitor-community/bluetooth-le')).BleClient;
      } catch (err) {
        console.warn('[NativeBLE] Plugin not available:', err);
        return null;
      }
    }
    if (!this.initialized) {
      // Matches the manifest: BLUETOOTH_SCAN is declared neverForLocation, so no location prompt.
      await withNativeTimeout(
        this.client.initialize({ androidNeverForLocation: true }),
        'Bluetooth did not start. Close the app, open it again and retry.',
      );
      this.initialized = true;
    }
    return { client: this.client };
  }

  public async connect(
    onBeats: BeatIntervalsHandler,
    onDisconnect: (deviceId: string) => void,
    connectedIds: string[],
  ): Promise<BleConnectResult> {
    let deviceId = '';
    try {
      const boxed = await this.ready();
      if (!boxed) return { success: false, error: 'Bluetooth is not available on this device.' };
      const { client } = boxed;
      if (!(await withNativeTimeout(client.isEnabled(), 'Bluetooth did not answer.')))
        return { success: false, error: 'Bluetooth is off. Turn it on and try again.' };

      const device = await client.requestDevice({ services: [BLE_UUIDS.HEART_RATE_SERVICE] });
      deviceId = device?.deviceId || '';
      if (!deviceId) return { success: false, cancelled: true };
      if (connectedIds.includes(deviceId))
        return { success: false, error: 'That sensor is already connected.' };

      await client.connect(deviceId, (id) => onDisconnect(id));
      await client.startNotifications(
        deviceId,
        BLE_UUIDS.HEART_RATE_SERVICE,
        BLE_UUIDS.HEART_RATE_MEASUREMENT,
        (value) => {
          onBeats(deviceId, parseBeatIntervalsMs(value));
        },
      );
      return { success: true, device: { id: deviceId, name: device.name || 'Heart rate sensor' } };
    } catch (err) {
      if (deviceId) await this.disconnect(deviceId);
      if (isPickerCancel(err)) return { success: false, cancelled: true };
      const message = err instanceof Error ? err.message : '';
      return { success: false, error: message || 'Could not connect to the sensor.' };
    }
  }

  public async disconnect(deviceId: string): Promise<void> {
    const client = this.client;
    if (!client) return;
    try {
      await client
        .stopNotifications(deviceId, BLE_UUIDS.HEART_RATE_SERVICE, BLE_UUIDS.HEART_RATE_MEASUREMENT)
        .catch(() => {});
      await client.disconnect(deviceId);
    } catch (err) {
      console.warn('[NativeBLE] Disconnect notice:', err);
    }
  }
}
