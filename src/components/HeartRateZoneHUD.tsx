import React, { useState, useEffect } from 'react';
import { Heart, Activity, Bluetooth, BluetoothConnected, X, Sparkles, AlertCircle } from 'lucide-react';
import { haptic } from '../utils/haptics';
import {
  scanFitnessDevices,
  connectToDevice,
  subscribeHeartRate,
  disconnectDevice,
  isWebBluetoothSupported,
} from '../utils/bluetoothManager';

interface HeartRateZoneHUDProps {
  isResting?: boolean;
  onReadyForSet?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

interface HRZoneInfo {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  min: number;
  max: number;
  colorClass: string;
  bgClass: string;
}

export const HeartRateZoneHUD: React.FC<HeartRateZoneHUDProps> = ({
  isResting = false,
  onReadyForSet,
  showToast,
}) => {
  const [bpm, setBpm] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeDevice, setActiveDevice] = useState<BluetoothDevice | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const maxHR = 190; // Standard athletic max HR assumption (or 220 - age)

  const getZone = (val: number): HRZoneInfo => {
    const pct = (val / maxHR) * 100;
    if (pct < 60) {
      return { zone: 1, name: 'Active Recovery', min: 0, max: 114, colorClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10 border-cyan-500/20' };
    }
    if (pct < 70) {
      return { zone: 2, name: 'Aerobic Base', min: 114, max: 133, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10 border-blue-500/20' };
    }
    if (pct < 80) {
      return { zone: 3, name: 'Tempo / Hypertrophy', min: 133, max: 152, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (pct < 90) {
      return { zone: 4, name: 'Threshold', min: 152, max: 171, colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10 border-orange-500/20' };
    }
    return { zone: 5, name: 'Max Effort', min: 171, max: 220, colorClass: 'text-red-500', bgClass: 'bg-red-500/15 border-red-500/30' };
  };

  const currentZone = getZone(bpm);
  const isRecovered = bpm <= 118;

  // Real BLE device pairing
  const handleConnectBLE = async () => {
    if (!isWebBluetoothSupported()) {
      showToast?.('Web Bluetooth is not supported on this browser. Starting live telemetry simulation.', 'error');
      setIsSimulated(true);
      setIsConnected(true);
      setDeviceName('Simulated Polar H10');
      return;
    }

    setIsScanning(true);
    try {
      const device = await scanFitnessDevices();
      setActiveDevice(device);
      setDeviceName(device.name || 'BLE Heart Monitor');
      
      const server = await connectToDevice(device);
      await subscribeHeartRate(server, (newBpm) => {
        setBpm(newBpm);
      });

      setIsConnected(true);
      setIsSimulated(false);
      showToast?.(`Paired with ${device.name || 'Heart Rate Monitor'}`, 'success');
      haptic.pulse();
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        showToast?.('Could not connect to BLE monitor: ' + (err.message || 'Unknown error'), 'error');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = () => {
    if (activeDevice) {
      disconnectDevice(activeDevice);
      setActiveDevice(null);
    }
    setIsConnected(false);
    setIsSimulated(false);
    setDeviceName('');
    haptic.tap();
  };

  // Realistic resting vs active fluctuation in simulation mode
  useEffect(() => {
    if (!isSimulated && !isConnected) return;
    const interval = setInterval(() => {
      setBpm((prev) => {
        if (isResting) {
          // Gradually drop HR towards recovery baseline (105-115)
          const target = 110;
          const step = (target - prev) * 0.15;
          return Math.round(prev + step + (Math.random() * 2 - 1));
        } else {
          // Slight natural heart rate variation around current zone
          const delta = (Math.random() * 4 - 2);
          return Math.round(Math.max(80, Math.min(185, prev + delta)));
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulated, isConnected, isResting]);

  return (
    <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 text-stone-900 dark:text-white shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Heart pulse icon */}
          <div className="relative">
            <Heart
              className={`w-4 h-4 ${currentZone.colorClass} fill-current animate-pulse stroke-[1.5]`}
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-sm font-bold text-stone-900 dark:text-white">
              {bpm} <span className="text-[10px] text-stone-400 font-normal">BPM</span>
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${currentZone.bgClass} ${currentZone.colorClass}`}
            >
              ZONE {currentZone.zone} • {currentZone.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-blue-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                {deviceName || 'BLE Live'}
              </span>
              <button
                onClick={handleDisconnect}
                className="text-[9px] font-mono text-stone-400 hover:text-red-400 p-1"
                title="Disconnect"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectBLE}
              disabled={isScanning}
              className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 text-[9.5px] font-mono font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Bluetooth className="w-3 h-3 text-blue-500" />
              <span>{isScanning ? 'Scanning...' : 'Pair BLE HRM'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Rest recovery indicator */}
      {isResting && (
        <div
          className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-[10px] font-mono transition-all ${
            isRecovered
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isRecovered
                ? 'Heart rate recovered (<118 BPM) — Ready for next set'
                : `Resting heart rate recovering... ${bpm} BPM (Target: <118)`}
            </span>
          </div>

          {isRecovered && onReadyForSet && (
            <button
              onClick={() => {
                haptic.pulse();
                onReadyForSet();
              }}
              className="px-2 py-0.5 rounded bg-blue-500 text-white font-bold text-[9px] hover:bg-blue-400 cursor-pointer"
            >
              Start Set
            </button>
          )}
        </div>
      )}
    </div>
  );
};
