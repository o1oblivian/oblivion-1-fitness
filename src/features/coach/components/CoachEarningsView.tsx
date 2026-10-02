import React from 'react';
import { CoachEarnings } from '../../../types';
import { CoachEarningsDeck } from './CoachEarningsDeck';

interface CoachEarningsViewProps {
  transactions?: CoachEarnings;
  activeClientsCount?: number;
  onSanitizerAudit?: (sanitized: CoachEarnings) => void;
  onShowToast: (msg: string) => void;
  coachId?: string;
}

export const CoachEarningsView: React.FC<CoachEarningsViewProps> = ({
  onShowToast,
  coachId = 'coach_alpha',
}) => {
  return (
    <div className="space-y-4">
      <CoachEarningsDeck coachId={coachId} onShowToast={onShowToast} />
    </div>
  );
};

export default CoachEarningsView;
