import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  Unplug,
  Activity,
  Heart,
  Moon,
  Footprints,
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
import { upsertDailySteps, loadDailySteps } from '@/utils/stepsStore';
import { upsertSleepLog, loadSleepLogs } from '@/utils/sleepStore';
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

  // Ingestion metrics state
  const [currentSteps, setCurrentSteps] = useState(0);
  const [liveHeartRate, setLiveHeartRate] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState(0);
  const [restingHR, setRestingHR] = useState<number | null>(null);

  // Modal for editing a metric on tap
  const [editingMetric, setEditingMetric] = useState<'steps' | 'heartRate' | 'sleep' | null>(null);
  const [editValue, setEditValue] = useState('');

  const hrCharRefs = useRef<Map<string, BluetoothRemoteGATTCharacteristic>>(new Map());
  const bleSupported = isWebBluetoothSupported();
  const userEmail = getSessionUserEmail() || 'athlete@ofc.com';

  // Load current ingested telemetry and restore stored devices on mount
  useEffect(() => {
    async function loadData() {
      try {
        const telemetry = await fetchHealthTelemetry(userEmail);
        if (telemetry) {
          setCurrentSteps(telemetry.steps || 0);
          setSleepHours(telemetry.sleep_hours || 0);
        }
        const stepList = await loadDailySteps(userEmail, 1);
        if (stepList.length > 0) {
          setCurrentSteps(stepList[0].steps);
        }
        const sleepList = await loadSleepLogs(userEmail, 1);
        if (sleepList.length > 0) {
          setSleepHours(Number((sleepList[0].duration_minutes / 60).toFixed(1)));
        }
      } catch {}

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
              hrv_ms: Math.round(55 + (bpm % 20)),
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

  // Ingestion Submissions on tap
  const handleSaveMetric = async () => {
    if (!editingMetric) return;

    if (editingMetric === 'steps') {
      const steps = parseInt(editValue, 10);
      if (!steps || steps <= 0) {
        triggerToast?.('Enter a valid step count');
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      try {
        await upsertDailySteps(userEmail, today, steps);
        const cur = await fetchHealthTelemetry(userEmail);
        await saveHealthTelemetry({ ...cur, steps });
        setCurrentSteps(steps);
        triggerHaptic('medium');
        triggerToast?.(`${steps.toLocaleString()} steps updated`);
      } catch {
        triggerToast?.('Could not save steps');
      }
    } else if (editingMetric === 'sleep') {
      const hours = parseFloat(editValue);
      if (!hours || hours <= 0 || hours > 24) {
        triggerToast?.('Enter valid sleep hours (e.g. 7.5)');
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      try {
        const bedtime = '23:00';
        const wakeMins = 23 * 60 + Math.round(hours * 60);
        const wakeH = Math.floor((wakeMins % (24 * 60)) / 60)
          .toString()
          .padStart(2, '0');
        const wakeM = Math.floor(wakeMins % 60)
          .toString()
          .padStart(2, '0');
        const wakeTime = `${wakeH}:${wakeM}`;

        await upsertSleepLog(userEmail, today, bedtime, wakeTime, 85, 'Direct Ingestion');
        const cur = await fetchHealthTelemetry(userEmail);
        await saveHealthTelemetry({ ...cur, sleep_hours: hours });
        setSleepHours(hours);
        triggerHaptic('medium');
        triggerToast?.(`${hours}h sleep updated`);
      } catch {
        triggerToast?.('Could not save sleep');
      }
    } else if (editingMetric === 'heartRate') {
      const hr = parseInt(editValue, 10);
      if (!hr || hr < 30 || hr > 240) {
        triggerToast?.('Enter valid heart rate (30-240 BPM)');
        return;
      }
      setRestingHR(hr);
      triggerHaptic('medium');
      triggerToast?.(`Resting HR ${hr} BPM updated`);
    }

    setEditingMetric(null);
    setEditValue('');
  };

  const openMetricEditor = (metric: 'steps' | 'heartRate' | 'sleep') => {
    triggerHaptic('light');
    setEditingMetric(metric);
    if (metric === 'steps') setEditValue(String(currentSteps));
    if (metric === 'heartRate') setEditValue(String(liveHeartRate || restingHR));
    if (metric === 'sleep') setEditValue(String(sleepHours));
  };

  return (
    <div>
      <SectionHeader
        title="Wearables & Telemetry Ingestion"
        subtitle="Tap any metric card to edit, or pair a live Bluetooth sensor"
      />

      {/* Telemetry Summary Cards - Tap to Edit */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Daily Steps */}
        <button
          type="button"
          onClick={() => openMetricEditor('steps')}
          className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-zinc-800/80 text-left hover:border-red-400 dark:hover:border-red-500/50 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <Footprints className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[9px] font-mono text-zinc-400 uppercase font-semibold group-hover:text-red-500 transition-colors">
              Tap Edit
            </span>
          </div>
          <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {currentSteps.toLocaleString()}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Daily Steps</p>
        </button>

        {/* Live / Resting Heart Rate */}
        <button
          type="button"
          onClick={() => openMetricEditor('heartRate')}
          className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-zinc-800/80 text-left hover:border-[#EA4335] dark:hover:border-[#EA4335]/50 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <Heart className="w-3.5 h-3.5 text-[#EA4335]" />
            <span className="text-[9px] font-mono text-emerald-500 uppercase font-semibold group-hover:underline">
              {liveHeartRate ? 'Live' : 'Resting'}
            </span>
          </div>
          <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {liveHeartRate || restingHR} <span className="text-[10px] font-normal text-zinc-500">BPM</span>
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Heart Rate</p>
        </button>

        {/* Sleep Duration */}
        <button
          type="button"
          onClick={() => openMetricEditor('sleep')}
          className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-zinc-800/80 text-left hover:border-indigo-400 dark:hover:border-indigo-500/50 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[9px] font-mono text-zinc-400 uppercase font-semibold group-hover:text-indigo-400 transition-colors">
              Tap Edit
            </span>
          </div>
          <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {sleepHours} <span className="text-[10px] font-normal text-zinc-500">hrs</span>
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Sleep Log</p>
        </button>
      </div>

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
            className="shrink-0 h-[26px] px-2.5 rounded-full bg-[#EA4335] text-white text-[11px] font-semibold flex items-center gap-1.5 hover:bg-red-600 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
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
                    <Activity className="w-3.5 h-3.5 text-[#EA4335]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">{dev.name}</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                      <span className="text-emerald-500 font-medium">Connected</span>
                      {dev.battery !== null && (
                        <span className="flex items-center gap-0.5 text-zinc-400">
                          <Battery className="w-3 h-3 text-zinc-400" />
                          {dev.battery}%
                        </span>
                      )}
                      {dev.heartRate && (
                        <span className="text-[#EA4335] font-bold tabular-nums">
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
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-[#EA4335] hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Unplug className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingsGroup>

      {/* Direct In-Place Metric Edit Modal (Apple Health Style) */}
      {editingMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  editingMetric === 'steps' ? 'bg-red-500/10 text-red-500' :
                  editingMetric === 'heartRate' ? 'bg-[#EA4335]/10 text-[#EA4335]' :
                  'bg-indigo-500/10 text-indigo-400'
                }`}>
                  {editingMetric === 'steps' && <Footprints className="w-4 h-4" />}
                  {editingMetric === 'heartRate' && <Heart className="w-4 h-4" />}
                  {editingMetric === 'sleep' && <Moon className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {editingMetric === 'steps' && 'Edit Daily Steps'}
                    {editingMetric === 'heartRate' && 'Edit Resting Heart Rate'}
                    {editingMetric === 'sleep' && 'Edit Sleep Duration'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {editingMetric === 'steps' && 'Enter total steps taken today'}
                    {editingMetric === 'heartRate' && 'Enter baseline resting BPM (30-240)'}
                    {editingMetric === 'sleep' && 'Enter total sleep in hours (e.g. 7.5)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMetric(null)}
                className="btn-nude-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <input
                type="number"
                step={editingMetric === 'sleep' ? '0.1' : '1'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                placeholder={
                  editingMetric === 'steps' ? '10000' :
                  editingMetric === 'heartRate' ? '65' : '8.0'
                }
                className="w-full h-12 text-center text-xl font-bold rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700/80 focus:border-[#EA4335]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingMetric(null)}
                className="flex-1 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMetric}
                className="flex-1 h-10 rounded-xl bg-[#EA4335] text-white text-xs font-semibold hover:bg-red-600 cursor-pointer shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Apple Pro Pair Device & Sensor Hub Modal ─── */}
      {pairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Bluetooth className="w-4 h-4 text-[#EA4335]" />
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
                    <Radio className="w-4 h-4 text-[#EA4335]" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">Hardware Scanner</span>
                  </div>
                  {bleSupported ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold">
                      Web BLE Ready
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-semibold">
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
                  className="w-full h-10 rounded-xl bg-[#EA4335] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-red-600 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
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
                <ul className="text-[11px] text-zinc-500 space-y-1.5 pl-4 list-disc marker:text-red-500">
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
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
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
