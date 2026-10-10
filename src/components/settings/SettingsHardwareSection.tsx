import React, { useState, useEffect } from 'react';
import { BleDeviceRow } from './hardware/BleDeviceRow';
import { MotionSensorRow } from './hardware/MotionSensorRow';
import { bluetoothSensorService, BluetoothDeviceInfo } from '../../services/bluetoothSensorService';
import { motionPedometerService, MotionEngineStatus } from '../../services/motionPedometerService';
import { tactileEngine } from '../../services/tactileEngine';

interface ConnectedDevicesProps {
  liveIngestionStream: boolean;
  isPairing: boolean;
  onPairDevice: () => void;
  onToggleLiveStream: (val: boolean) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsHardwareSection: React.FC<ConnectedDevicesProps> = ({
  liveIngestionStream,
  isPairing,
  onToggleLiveStream,
  onShowToast,
}) => {
  const [bleDevice, setBleDevice] = useState<BluetoothDeviceInfo | null>(
    bluetoothSensorService.getConnectedDevice()
  );
  const [bleError, setBleError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [motionStatus, setMotionStatus] = useState<MotionEngineStatus>(
    motionPedometerService.getStatus()
  );
  const [motionError, setMotionError] = useState<string | null>(null);

  useEffect(() => {
    const unsubBle = bluetoothSensorService.subscribe((dev: BluetoothDeviceInfo | null, err?: string) => {
      setBleDevice(dev);
      setBleError(err || null);
    });
    const unsubMotion = motionPedometerService.subscribe((st) => setMotionStatus(st));
    return () => {
      unsubBle();
      unsubMotion();
    };
  }, []);

  const handlePairBle = async () => {
    tactileEngine.triggerSelectionBuzz();
    setIsScanning(true);
    setBleError(null);
    const res = await bluetoothSensorService.requestAndConnect();
    setIsScanning(false);
    if (!res.success && res.error) {
      setBleError(res.error);
      onShowToast?.(
        res.error.toLowerCase().includes('denied') || res.error.toLowerCase().includes('cancel')
          ? 'Bluetooth access cancelled. Manual HR tracking active.'
          : `${res.error} (Fallback manual tracking active)`,
        'info'
      );
    }
  };

  const handleToggleMotion = async (enable: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    setMotionError(null);
    if (enable) {
      const res = await motionPedometerService.requestPermissionAndStart();
      if (!res.success && res.error) {
        setMotionError(res.error);
        onShowToast?.(
          res.error.toLowerCase().includes('denied')
            ? 'Motion permission denied. Manual step logging active.'
            : `${res.error} (Manual step logging active)`,
          'info'
        );
      }
    } else {
      motionPedometerService.stopTracking();
    }
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold px-1">
        Connected Devices &amp; Hardware Sensors
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-xs p-3 space-y-2.5 transition-colors">
        <BleDeviceRow
          device={bleDevice}
          error={bleError}
          isScanning={isScanning}
          isPairing={isPairing || isScanning}
          isSupported={bluetoothSensorService.isSupported()}
          onPair={handlePairBle}
          onDisconnect={() => {
            tactileEngine.triggerSelectionBuzz();
            bluetoothSensorService.disconnect();
          }}
        />

        <MotionSensorRow
          status={motionStatus}
          error={motionError}
          onToggle={handleToggleMotion}
        />
      </div>
    </div>
  );
};

export default SettingsHardwareSection;
