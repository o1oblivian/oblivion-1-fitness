/**
 * Oblivion 1 Fitness Club - Hybrid Bluetooth Sensor Service
 * Native iOS/Android via @capacitor-community/bluetooth-le + Web Bluetooth fallback
 * Strict File Ceiling: < 140 lines
 */

import { Capacitor } from '@capacitor/core';
import { BluetoothDeviceInfo, BluetoothStateChangeCallback, BleConnectResult } from './ble/bleTypes';
import { NativeBleDriver } from './ble/nativeBleDriver';
import { WebBleDriver } from './ble/webBleDriver';
import { tactileEngine } from './tactileEngine';

class BluetoothSensorService {
  private nativeDriver = new NativeBleDriver();
  private webDriver = new WebBleDriver();
  private listeners: Set<BluetoothStateChangeCallback> = new Set();
  private isScanning = false;

  public isSupported(): boolean {
    if (Capacitor.isNativePlatform()) return true;
    return this.webDriver.isSupported();
  }

  public subscribe(cb: BluetoothStateChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(info: BluetoothDeviceInfo | null, error?: string) {
    this.listeners.forEach((cb) => {
      try {
        cb(info, error);
      } catch (err) {
        console.error('[BLE] Notification error:', err);
      }
    });
  }

  public getConnectedDevice(): BluetoothDeviceInfo | null {
    if (Capacitor.isNativePlatform()) {
      return this.nativeDriver.getConnectedInfo();
    }
    return this.webDriver.getConnectedInfo();
  }

  public async requestAndConnect(): Promise<BleConnectResult> {
    if (this.isScanning) {
      return { success: false, error: 'Pairing scan in progress.' };
    }

    this.isScanning = true;
    tactileEngine.triggerSelectionBuzz();

    const onHeartRate = (bpm: number) => {
      window.dispatchEvent(
        new CustomEvent('o1fc_ble_heart_rate', {
          detail: { heartRate: bpm, timestamp: Date.now() },
        })
      );
    };

    const onDisconnect = () => {
      this.notify(null, 'Sensor disconnected');
    };

    let result: BleConnectResult;

    if (Capacitor.isNativePlatform()) {
      result = await this.nativeDriver.connect(onHeartRate, onDisconnect);
    } else {
      result = await this.webDriver.connect(onHeartRate, onDisconnect);
    }

    this.isScanning = false;

    if (result.success) {
      tactileEngine.playPRCelebration();
      this.notify(this.getConnectedDevice());
    } else {
      this.notify(null, result.error);
    }

    return result;
  }

  public disconnect(): void {
    if (Capacitor.isNativePlatform()) {
      this.nativeDriver.disconnect();
    } else {
      this.webDriver.disconnect();
    }
    this.notify(null);
  }
}

export * from './ble/bleTypes';
export const bluetoothSensorService = new BluetoothSensorService();
