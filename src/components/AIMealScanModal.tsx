import React from 'react';
import { MealMacroScannerModal, MealMacroScannerModalProps } from './MealMacroScannerModal';

export type AIMealScanModalProps = MealMacroScannerModalProps;

export const AIMealScanModal: React.FC<AIMealScanModalProps> = (props) => {
  return <MealMacroScannerModal {...props} />;
};

export default AIMealScanModal;
