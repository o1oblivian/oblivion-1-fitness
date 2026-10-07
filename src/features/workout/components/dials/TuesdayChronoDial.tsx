import React from 'react';
import { DialComponentProps } from './dialTypes';
import { LuxuryConcentricFace } from './LuxuryDialChrome';
import { AMBER } from './luxuryDialShared';

export const TuesdayChronoDial: React.FC<DialComponentProps> = (props) => (
  <LuxuryConcentricFace {...props} caption="Chronograph" accent={AMBER} ticks={12} />
);

export default TuesdayChronoDial;
