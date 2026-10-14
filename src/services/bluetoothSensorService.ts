/**
 * Oblivion 1 Fitness Club - Bluetooth HRV sensors.
 * Up to two heart-rate sensors at once. Only beat-to-beat intervals are read, turned into HRV,
 * and kept on this phone. Nothing is written to a sensor and nothing is sent to the account.
 */

import { Capacitor } from '@capacitor/core';
import { BleDriver, BluetoothDeviceInfo, BluetoothStateChangeCallback, BleConnectResult, MAX_BLE_DEVICES } from './ble/bleTypes';
import { NativeBleDriver } from './ble/nativeBleDriver';
import { WebBleDriver } from './ble/webBleDriver';
import { HrvCollector, flushHrv, useHrvStore } from './ble/hrv';
import { tactileEngine } from './tactileEngine';

/** Packets without beat intervals before a sensor is marked as unable to give HRV. */
const NO_INTERVALS_LIMIT = 15;

interface Connection {
  info: BluetoothDeviceInfo;
  collector: HrvCollector;
  packetsWithoutIntervals: number;
}

class BluetoothSensorService {
  private driver: BleDriver = Capacitor.isNativePlatform() ? new NativeBleDriver() : new WebBleDriver();
  private connections = new Map<string, Connection>();
  private listeners = new Set<BluetoothStateChangeCallback>();
  private pairing = false;

  public isSupported(): boolean {
    return this.driver.isSupported();
  }

  public subscribe(cb: BluetoothStateChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getDevices(): BluetoothDeviceInfo[] {
    return [...this.connections.values()].map((c) => ({ ...c.info }));
  }

  public isFull(): boolean {
    return this.connections.size >= MAX_BLE_DEVICES;
  }

  private notify(error?: string) {
    const devices = this.getDevices();
    this.listeners.forEach((cb) => {
      try {
        cb(devices, error);
      } catch (err) {
        console.error('[BLE] Listener error:', err);
      }
    });
  }

  private handleBeats = (deviceId: string, intervalsMs: number[] | null) => {
    const conn = this.connections.get(deviceId);
    if (!conn) return;
    if (!intervalsMs || intervalsMs.length === 0) {
      conn.packetsWithoutIntervals++;
      if (conn.info.sendsBeatIntervals === null && conn.packetsWithoutIntervals >= NO_INTERVALS_LIMIT) {
        conn.info.sendsBeatIntervals = false;
        this.notify();
      }
      return;
    }
    conn.packetsWithoutIntervals = 0;
    const first = conn.info.sendsBeatIntervals !== true;
    conn.info.sendsBeatIntervals = true;
    const hrv = conn.collector.push(intervalsMs);
    if (hrv !== null) useHrvStore.getState().record({ rmssdMs: hrv, at: Date.now(), device: conn.info.name });
    if (first || hrv !== conn.info.hrvMs) {
      conn.info.hrvMs = hrv;
      this.notify();
    }
  };

  private handleDisconnect = (deviceId: string) => {
    if (!this.connections.delete(deviceId)) return;
    flushHrv();
    this.notify('A sensor disconnected.');
  };

  public async requestAndConnect(): Promise<BleConnectResult> {
    if (this.pairing) return { success: false, error: 'Already looking for a sensor.' };
    if (this.isFull()) return { success: false, error: `Up to ${MAX_BLE_DEVICES} sensors can be connected.` };
    this.pairing = true;
    try {
      const result = await this.driver.connect(this.handleBeats, this.handleDisconnect, [...this.connections.keys()]);
      if (result.success && result.device) {
        this.connections.set(result.device.id, {
          info: { id: result.device.id, name: result.device.name, hrvMs: null, sendsBeatIntervals: null },
          collector: new HrvCollector(),
          packetsWithoutIntervals: 0,
        });
        tactileEngine.triggerSelectionBuzz();
        this.notify();
      } else if (result.error) {
        this.notify(result.error);
      }
      return result;
    } finally {
      this.pairing = false;
    }
  }

  public async disconnect(deviceId: string): Promise<void> {
    if (!this.connections.delete(deviceId)) return;
    await this.driver.disconnect(deviceId);
    flushHrv();
    this.notify();
  }

  public disconnectAll(): void {
    for (const id of [...this.connections.keys()]) void this.disconnect(id);
  }
}

export * from './ble/bleTypes';
export const bluetoothSensorService = new BluetoothSensorService();
