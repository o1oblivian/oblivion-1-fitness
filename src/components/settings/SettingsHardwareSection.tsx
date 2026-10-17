import React, { useState, useEffect } from 'react';
import { BleDeviceRow } from './hardware/BleDeviceRow';
import { MotionSensorRow } from './hardware/MotionSensorRow';
import { bluetoothSensorService, BluetoothDeviceInfo } from '../../services/bluetoothSensorService';
import { motionPedometerService, MotionEngineStatus } from '../../services/motionPedometerService';
import { tactileEngine } from '../../services/tactileEngine';

interface ConnectedDevicesProps {
  onShowToast?: (msg: string) => void;
}

export const SettingsHardwareSection: React.FC<ConnectedDevicesProps> = ({ onShowToast }) => {
  const [devices, setDevices] = useState<BluetoothDeviceInfo[]>(() => bluetoothSensorService.getDevices());
  const [bleError, setBleError] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const [motionStatus, setMotionStatus] = useState<MotionEngineStatus>(() => motionPedometerService.getStatus());
  const [motionError, setMotionError] = useState<string | null>(null);

  useEffect(() => {
    const unsubBle = bluetoothSensorService.subscribe((list, err) => {
      setDevices(list);
      setBleError(err ?? null);
    });
    const unsubMotion = motionPedometerService.subscribe(setMotionStatus);
    return () => {
      unsubBle();
      unsubMotion();
    };
  }, []);

  const handlePair = async () => {
    tactileEngine.triggerSelectionBuzz();
    setIsPairing(true);
    setBleError(null);
    const res = await bluetoothSensorService.requestAndConnect();
    setIsPairing(false);
    if (res.success) {
      onShowToast?.(`${res.device?.name ?? 'Sensor'} connected`);
    } else if (res.cancelled) {
      setBleError(null);
    } else if (res.error) {
      setBleError(res.error);
    }
  };

  const handleDisconnect = (deviceId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setBleError(null);
    void bluetoothSensorService.disconnect(deviceId);
  };

  const handleToggleMotion = async (enable: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    setMotionError(null);
    if (!enable) {
      motionPedometerService.turnOff();
      return;
    }
    const res = await motionPedometerService.requestPermissionAndStart();
    if (!res.success) {
      const msg = res.error?.toLowerCase().includes('denied')
        ? 'Motion access is blocked. Allow it in your phone settings to count steps.'
        : "This phone can't count steps.";
      setMotionError(msg);
    }
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold px-1">
        Devices &amp; sensors
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-xs p-3 space-y-2.5 transition-colors">
        <BleDeviceRow
          devices={devices}
          error={bleError}
          isPairing={isPairing}
          isSupported={bluetoothSensorService.isSupported()}
          onPair={handlePair}
          onDisconnect={handleDisconnect}
        />

        <MotionSensorRow status={motionStatus} error={motionError} onToggle={handleToggleMotion} />

        <p className="pt-2 border-t border-white/[0.05] text-[11px] font-sans text-neutral-400 leading-snug">
          HRV and steps are kept only on this phone. They are never uploaded or shared, and nothing is sent to your sensors.
        </p>
      </div>
    </div>
  );
};


