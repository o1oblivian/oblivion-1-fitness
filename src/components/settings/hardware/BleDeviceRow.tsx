import React from 'react';
import { Bluetooth, RefreshCw, AlertCircle } from 'lucide-react';
import { BluetoothDeviceInfo, MAX_BLE_DEVICES } from '../../../services/ble/bleTypes';

interface BleDeviceRowProps {
  devices: BluetoothDeviceInfo[];
  error: string | null;
  isPairing: boolean;
  isSupported: boolean;
  onPair: () => void;
  onDisconnect: (deviceId: string) => void;
}

function hrvLine(device: BluetoothDeviceInfo): string {
  if (device.sendsBeatIntervals === false) return "This sensor doesn't share HRV";
  if (device.hrvMs !== null) return `HRV ${device.hrvMs} ms`;
  return 'Measuring HRV… keep still for a few minutes';
}

export const BleDeviceRow: React.FC<BleDeviceRowProps> = ({
  devices,
  error,
  isPairing,
  isSupported,
  onPair,
  onDisconnect,
}) => {
  const full = devices.length >= MAX_BLE_DEVICES;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Bluetooth className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-tactical font-semibold text-neutral-100 block">
              Heart rate sensor (HRV)
            </span>
            <span className="text-o1-label font-sans text-neutral-400 block">
              {!isSupported
                ? "This phone can't use Bluetooth sensors"
                : full
                  ? `${devices.length} of ${MAX_BLE_DEVICES} connected`
                  : `Up to ${MAX_BLE_DEVICES} sensors. HRV only, stays on this phone.`}
            </span>
          </div>
        </div>

        {isSupported && !full && (
          <button
            type="button"
            disabled={isPairing}
            onClick={onPair}
            className="o1-pill min-h-[44px] bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-xs font-sans font-semibold active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isPairing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" aria-hidden />
                <span>Looking…</span>
              </>
            ) : (
              <span>Pair sensor</span>
            )}
          </button>
        )}
      </div>

      {devices.length > 0 && (
        <ul className="space-y-1.5">
          {devices.map((device) => (
            <li
              key={device.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-o1-well border border-white/[0.07]"
            >
              <div className="min-w-0">
                <span className="text-xs font-sans font-semibold text-neutral-100 block truncate">
                  {device.name}
                </span>
                <span
                  className={`text-o1-label font-sans block ${
                    device.sendsBeatIntervals === false ? 'text-amber-300' : 'text-neutral-400'
                  }`}
                >
                  {hrvLine(device)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDisconnect(device.id)}
                aria-label={`Disconnect ${device.name}`}
                className="o1-pill min-h-[44px] bg-o1-surface hover:bg-white/[0.06] border border-white/[0.07] text-neutral-200 text-xs font-sans font-semibold active:scale-95 cursor-pointer shrink-0"
              >
                Disconnect
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div
          role="alert"
          className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-o1-label text-amber-300"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
