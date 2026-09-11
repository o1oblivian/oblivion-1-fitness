import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  Unplug,
  Activity,
  RefreshCw,
  Plus,
  ShieldCheck,
  Bluetooth,
  Radio,
  Watch,
  Zap,
  Check,
  X,
  ChevronRight,
  Info,
  Battery,
} from 'lucide-react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import {
  isWebBluetoothSupported,
  scanFitnessDevices,
  connectToDevice,
  readBatteryLevel,
  subscribeHeartRate,
  disconnectDevice,
  onDeviceDisconnected,
  getAvailableServices,
  getStoredDevices,
  storeDevice,
  removeStoredDevice,
  StoredDevice,
} from '@/utils/bluetoothManager';
import { fetchHealthTelemetry, saveHealthTelemetry } from '@/utils/healthTelemetryStore';
import { getSessionUserEmail } from '@/utils/authStorage';
import { triggerHaptic } from '@/utils/haptics';

interface ActiveDevice {
  id: string;
  name: string;
  type: 'ble' | 'virtual';
  nativeDevice?: BluetoothDevice;
  gattServer?: BluetoothRemoteGATTServer | null;
  battery: number | null;
  heartRate: number | null;
  status: 'connected' | 'disconnected' | 'connecting';
  services: string[];
  connectedAt: number;
}

interface Props {
  triggerToast?: (msg: string) => void;
  onBack?: () => void;
}

export function DevicesSection({ triggerToast }: Props) {
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);
  const [autoSync, setAutoSync] = useState(() => {
    try {
      return localStorage.getItem('ofc_live_telemetry_stream') !== 'false';
    } catch {
      return true;
    }
  });
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [pairModalOpen, setPairModalOpen] = useState(false);

  const handleToggleAutoSync = (nextVal: boolean) => {
    setAutoSync(nextVal);
    try {
      localStorage.setItem('ofc_live_telemetry_stream', String(nextVal));
    } catch {}
    triggerHaptic('light');
    triggerToast?.(nextVal ? 'Live ingestion telemetry stream enabled' : 'Live ingestion telemetry stream paused');
  };

  // Genuine sensor telemetry state (live heart rate for connected BLE devices)
  const [liveHeartRate, setLiveHeartRate] = useState<number | null>(null);

  const hrCharRefs = useRef<Map<string, BluetoothRemoteGATTCharacteristic>>(new Map());
  const bleSupported = isWebBluetoothSupported();
  const userEmail = getSessionUserEmail() || 'athlete@ofc.com';

  // Restore stored devices on mount
  useEffect(() => {
    function loadData() {
      // Restore previously stored paired devices
      const stored = getStoredDevices();
      if (stored.length > 0) {
        const restored: ActiveDevice[] = stored.map((s) => ({
          id: s.id,
          name: s.name,
          type: 'ble',
          battery: null,
          heartRate: null,
          status: 'disconnected',
          services: s.services || ['heart_rate'],
          connectedAt: s.connectedAt || Date.now(),
        }));
        setActiveDevices(restored);
      }
    }
    loadData();
  }, [userEmail]);

  // Clean up connections on unmount
  useEffect(() => {
    return () => {
      activeDevices.forEach((d) => {
        if (d.nativeDevice?.gatt?.connected) d.nativeDevice.gatt.disconnect();
      });
    };
  }, [activeDevices]);

  // Trigger BLE hardware scan
  const handleScanBLE = async () => {
    setScanning(true);
    setScanError(null);
    try {
      const device = await scanFitnessDevices();
      await pairNativeBLEDevice(device);
      setPairModalOpen(false);
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = err?.message || '';

      if (errName === 'NotFoundError' || errMsg.includes('User cancelled')) {
        setScanError('No Bluetooth device selected or scanner timed out. Ensure your sensor is on and in pairing mode.');
      } else if (errName === 'SecurityError' || errMsg.includes('Permissions-Policy') || errMsg.includes('disallowed')) {
        setScanError('Web Bluetooth is blocked by the browser policy or preview iframe. Open the app directly in a full browser tab.');
      } else if (errName === 'NotSupportedError' || !bleSupported) {
        setScanError('Web Bluetooth API is disabled in this browser. In Brave, enable it at brave://flags/#enable-web-bluetooth, or use Chrome.');
      } else {
        setScanError(errMsg || 'Bluetooth scan could not complete.');
        triggerToast?.(errMsg || 'Bluetooth scan could not complete');
      }
    } finally {
      setScanning(false);
    }
  };

  // Pair native Web Bluetooth hardware
  const pairNativeBLEDevice = async (device: BluetoothDevice) => {
    if (activeDevices.some((d) => d.id === device.id)) {
      triggerToast?.(`${device.name || 'Device'} is already paired`);
      return;
    }

    const newDevice: ActiveDevice = {
      id: device.id,
      name: device.name || 'Bluetooth Fitness Sensor',
      type: 'ble',
      nativeDevice: device,
      gattServer: null,
      battery: null,
      heartRate: null,
      status: 'connecting',
      services: [],
      connectedAt: Date.now(),
    };

    setActiveDevices((prev) => [newDevice, ...prev]);

    try {
      const server = await connectToDevice(device);
      const battery = await readBatteryLevel(server);
      const services = await getAvailableServices(server);

      const hrChar = await subscribeHeartRate(server, (bpm) => {
        setLiveHeartRate(bpm);
        setActiveDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, heartRate: bpm, status: 'connected' } : d))
        );

        if (autoSync) {
          fetchHealthTelemetry(userEmail).then((cur) => {
            saveHealthTelemetry({
              ...cur,
              updated_at: new Date().toISOString(),
            }).catch(() => {});
          });
        }
      });
      if (hrChar) hrCharRefs.current.set(device.id, hrChar);

      onDeviceDisconnected(device, () => {
        setActiveDevices((prev) =>
          prev.map((d) =>
            d.id === device.id ? { ...d, status: 'disconnected', heartRate: null } : d
          )
        );
      });

      setActiveDevices((prev) =>
        prev.map((d) =>
          d.id === device.id
            ? { ...d, gattServer: server, battery, services, status: 'connected' }
            : d
        )
      );

      storeDevice({
        id: device.id,
        name: device.name || 'Bluetooth Fitness Sensor',
        type: 'ble',
        services,
        connectedAt: Date.now(),
      });
      triggerHaptic('success');
      triggerToast?.(`Paired ${device.name || 'device'}`);
    } catch (err: any) {
      setActiveDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, status: 'disconnected' } : d))
      );
      triggerToast?.(`Connection failed: ${err.message || 'unknown error'}`);
    }
  };

  // Disconnect active device
  const handleDisconnect = (deviceId: string) => {
    const device = activeDevices.find((d) => d.id === deviceId);
    if (device) {
      if (device.nativeDevice) {
        disconnectDevice(device.nativeDevice);
      }
      const hrChar = hrCharRefs.current.get(deviceId);
      if (hrChar) {
        hrChar.stopNotifications().catch(() => {});
        hrCharRefs.current.delete(deviceId);
      }
    }

    setActiveDevices((prev) => prev.filter((d) => d.id !== deviceId));
    removeStoredDevice(deviceId);

    // If no other devices streaming, reset live HR
    if (activeDevices.length <= 1) {
      setLiveHeartRate(null);
    }

    triggerHaptic('light');
    triggerToast?.('Device disconnected');
  };

  return (
    <div>
      <SectionHeader
        title="Connected Devices & Wearables"
        subtitle="Manage Bluetooth heart rate monitors, smart sensors, and wearable connections"
      />

      <SettingsGroup>
        {/* Bluetooth Device Pairing Header */}
        <div className="min-h-[52px] px-3.5 py-1.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 block">
              Bluetooth Sensors & HR Straps
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
              Direct BLE stream for heart rate & cadence
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPairModalOpen(true)}
            className="shrink-0 h-[26px] px-2.5 rounded-full bg-[#C4121A] text-white text-[11px] font-semibold flex items-center gap-1.5 hover:bg-red-600 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            <Bluetooth className="w-3.5 h-3.5" />
            Pair Device
          </button>
        </div>

        <SettingsRow
          label="Live Ingestion Stream"
          sublabel="Stream live heart rate data straight into workout telemetry"
          rightElement={<ToggleSwitch checked={autoSync} onChange={handleToggleAutoSync} />}
        />

        {activeDevices.length > 0 && (
          <div className="p-2.5 space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/60">
            {activeDevices.map((dev) => (
              <div
                key={dev.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/70"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-[#C4121A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">{dev.name}</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C4121A] dark:bg-[#D91F28]" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">Connected</span>
                      {dev.battery !== null && (
                        <span className="flex items-center gap-0.5 text-zinc-400">
                          <Battery className="w-3 h-3 text-zinc-400" />
                          {dev.battery}%
                        </span>
                      )}
                      {dev.heartRate && (
                        <span className="text-[#C4121A] dark:text-[#D91F28] font-bold tabular-nums">
                          {dev.heartRate} BPM
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDisconnect(dev.id)}
                  title="Disconnect sensor"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-[#C4121A] hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Unplug className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingsGroup>

      {/* ─── Apple Pro Pair Device & Sensor Hub Modal ─── */}
      {pairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Bluetooth className="w-4 h-4 text-[#C4121A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Pair Bluetooth Sensor</h3>
                  <p className="text-[11px] text-zinc-500">Connect heart rate monitor, cycling or fitness sensor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPairModalOpen(false);
                  setScanError(null);
                }}
                className="btn-nude-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* BLE Scanner Container */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#C4121A]" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">Hardware Scanner</span>
                  </div>
                  {bleSupported ? (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold">
                      Web BLE Ready
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold">
                      Browser Restricted
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
                  Scans for standard Bluetooth Low Energy (BLE) sensors (Heart Rate, Cycling Cadence/Power, Rowing, and Fitness Equipment).
                </p>

                <button
                  type="button"
                  onClick={handleScanBLE}
                  disabled={scanning}
                  className="w-full h-10 rounded-xl bg-[#C4121A] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#9B0E14] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scanning for Nearby Sensors...
                    </>
                  ) : (
                    <>
                      <Bluetooth className="w-3.5 h-3.5" />
                      Scan for Nearby BLE Devices
                    </>
                  )}
                </button>

                {/* Error / Status Message */}
                {scanError && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-500 leading-relaxed flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-400">Scan Status</p>
                      <p className="text-zinc-600 dark:text-zinc-300 mt-0.5">{scanError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pairing Instructions & Troubleshooting Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Pairing Checklist & Compatibility
                  </span>
                </div>
                <ul className="text-[11px] text-zinc-500 space-y-1.5 pl-4 list-disc marker:text-[#C4121A]">
                  <li>
                    <strong className="text-zinc-700 dark:text-zinc-300">Device Pairing Mode:</strong> Make sure your heart rate strap or sensor is strapped on / awake and not actively connected to another app.
                  </li>
                  <li>
                    <strong className="text-zinc-700 dark:text-zinc-300">Browser Policy (Brave / Chrome):</strong> Brave disables Web Bluetooth by default for privacy. You can enable it at <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-800 dark:text-zinc-200">brave://flags/#enable-web-bluetooth</code>, or open the direct URL in Chrome.
                  </li>
                  <li>
                    <strong className="text-zinc-700 dark:text-zinc-300">OS Permissions:</strong> Ensure system Bluetooth and Location permissions are enabled for your browser on mobile. (Note: iOS WebKit restricts Web Bluetooth).
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                Direct hardware GATT connection
              </span>
              <button
                type="button"
                onClick={() => {
                  setPairModalOpen(false);
                  setScanError(null);
                }}
                className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DevicesSection;
