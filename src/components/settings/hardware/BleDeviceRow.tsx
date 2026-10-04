import React from 'react';
import { Bluetooth, RefreshCw, AlertCircle } from 'lucide-react';
import { BluetoothDeviceInfo } from '../../../services/ble/bleTypes';

interface BleDeviceRowProps {
  device: BluetoothDeviceInfo | null;
  error: string | null;
  isScanning: boolean;
  isPairing: boolean;
  isSupported: boolean;
  onPair: () => void;
  onDisconnect: () => void;
}

export const BleDeviceRow: React.FC<BleDeviceRowProps> = ({
  device,
  error,
  isScanning,
  isPairing,
  isSupported,
  onPair,
  onDisconnect,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Bluetooth className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100 block">
              Bluetooth HR Strap &amp; Cadence
            </span>
            <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 block truncate">
              {device?.connected
                ? `Connected: ${device.name}`
                : isSupported
                ? 'Native BLE / Web Bluetooth GATT stream (0x180D)'
                : 'Requires Bluetooth capable hardware'}
            </span>
          </div>
        </div>

        {device?.connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="shrink-0 px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-tactical font-semibold uppercase shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            disabled={isScanning || isPairing}
            onClick={onPair}
            className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#C4121A] hover:bg-[#a50f16] text-white text-xs font-tactical font-semibold uppercase shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <span>Pair BLE</span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
