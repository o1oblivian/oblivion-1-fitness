/**
 * Oblivion 1 Fitness Club - Web Bluetooth Fallback Driver
 * Powered by standard Web Bluetooth API (navigator.bluetooth)
 * Strict File Ceiling: < 140 lines
 */

import { BluetoothDeviceInfo, parseHeartRateValue, BleConnectResult } from './bleTypes';

export class WebBleDriver {
  private device: any = null;
  private server: any = null;
  private hrChar: any = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public async connect(
    onHeartRate: (bpm: number) => void,
    onDisconnect: () => void
  ): Promise<BleConnectResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'Web Bluetooth is not supported on this browser platform.',
      };
    }

    try {
      const navBle = (navigator as any).bluetooth;
      const device = await navBle.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['cycling_speed_and_cadence'] },
          { services: ['running_speed_and_cadence'] },
        ],
        optionalServices: ['battery_service', 0x180d, 0x1816, 0x1814],
      });

      if (!device) return { success: false, error: 'No device selected' };

      this.device = device;
      device.addEventListener('gattserverdisconnected', () => {
        this.device = null;
        this.server = null;
        this.hrChar = null;
        onDisconnect();
      });

      const server = await device.gatt.connect();
      this.server = server;

      try {
        const hrService = await server.getPrimaryService('heart_rate');
        const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
        await hrChar.startNotifications();
        hrChar.addEventListener('characteristicvaluechanged', (evt: any) => {
          const val = evt.target.value;
          if (val) {
            const bpm = parseHeartRateValue(val);
            if (bpm > 30 && bpm < 240) onHeartRate(bpm);
          }
        });
        this.hrChar = hrChar;
      } catch (err) {
        console.warn('[WebBLE] HR Service warning:', err);
      }

      return { success: true, deviceName: device.name || 'Web BLE Device' };
    } catch (err: any) {
      this.device = null;
      return { success: false, error: err?.message || 'Web BLE connection failed' };
    }
  }

  public disconnect(): void {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.hrChar = null;
  }

  public getConnectedInfo(): BluetoothDeviceInfo | null {
    if (!this.device || !this.device.gatt?.connected) return null;
    return {
      id: this.device.id,
      name: this.device.name || 'Web Bluetooth Sensor',
      connected: true,
      serviceType: this.hrChar ? 'heart_rate' : 'generic',
    };
  }
}
