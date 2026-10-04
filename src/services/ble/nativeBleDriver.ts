/**
 * Oblivion 1 Fitness Club - Native Bluetooth Driver (iOS & Android)
 * Powered by @capacitor-community/bluetooth-le (BleClient)
 * Strict File Ceiling: < 140 lines
 */

import { Capacitor } from '@capacitor/core';
import { BLE_UUIDS, BluetoothDeviceInfo, parseHeartRateValue, BleConnectResult } from './bleTypes';

export class NativeBleDriver {
  private activeDeviceId: string | null = null;
  private isInitialized = false;

  private async getBleClient() {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      const module = await import('@capacitor-community/bluetooth-le');
      return module.BleClient;
    } catch (e) {
      console.warn('[NativeBLE] Plugin not available:', e);
      return null;
    }
  }

  private async ensureInitialized(): Promise<any> {
    if (!Capacitor.isNativePlatform()) return null;
    const BleClient = await this.getBleClient();
    if (!BleClient) return null;
    if (!this.isInitialized) {
      await BleClient.initialize();
      this.isInitialized = true;
    }
    return BleClient;
  }

  public async connect(
    onHeartRate: (bpm: number) => void,
    onDisconnect: () => void
  ): Promise<BleConnectResult> {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'Native BLE driver requires iOS/Android native container.' };
    }

    try {
      const BleClient = await this.ensureInitialized();
      if (!BleClient) {
        return { success: false, error: 'Native BLE plugin unavailable.' };
      }

      const device = await BleClient.requestDevice({
        services: [
          BLE_UUIDS.HEART_RATE_SERVICE,
          BLE_UUIDS.CYCLING_SPEED_CADENCE_SERVICE,
          BLE_UUIDS.RUNNING_SPEED_CADENCE_SERVICE,
        ],
        optionalServices: [],
      });

      if (!device?.deviceId) {
        return { success: false, error: 'No BLE sensor selected.' };
      }

      await BleClient.connect(device.deviceId, () => {
        this.activeDeviceId = null;
        onDisconnect();
      });

      this.activeDeviceId = device.deviceId;

      // Subscribe to Heart Rate notifications
      try {
        await BleClient.startNotifications(
          device.deviceId,
          BLE_UUIDS.HEART_RATE_SERVICE,
          BLE_UUIDS.HEART_RATE_MEASUREMENT,
          (value: DataView) => {
            const bpm = parseHeartRateValue(value);
            if (bpm > 30 && bpm < 240) {
              onHeartRate(bpm);
            }
          }
        );
      } catch (err) {
        console.warn('[NativeBLE] HR service notification warning:', err);
      }

      return {
        success: true,
        deviceName: device.name || 'Native BLE Wearable',
      };
    } catch (err: any) {
      this.activeDeviceId = null;
      return {
        success: false,
        error: err?.message || 'Failed native BLE connection',
      };
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.activeDeviceId) return;
    try {
      const BleClient = await this.getBleClient();
      if (BleClient) {
        await BleClient.disconnect(this.activeDeviceId);
      }
    } catch (err) {
      console.warn('[NativeBLE] Disconnect error:', err);
    } finally {
      this.activeDeviceId = null;
    }
  }

  public getConnectedInfo(): BluetoothDeviceInfo | null {
    if (!this.activeDeviceId) return null;
    return {
      id: this.activeDeviceId,
      name: 'Paired Native BLE Sensor',
      connected: true,
      serviceType: 'heart_rate',
    };
  }
}
