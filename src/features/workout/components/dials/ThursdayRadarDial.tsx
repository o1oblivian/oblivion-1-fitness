import React from 'react';
import { DialComponentProps } from './dialTypes';
import { LuxuryConcentricFace } from './LuxuryDialChrome';
import { SKY } from './luxuryDialShared';

export const ThursdayRadarDial: React.FC<DialComponentProps> = (props) => (
  <LuxuryConcentricFace {...props} caption="Radar" accent={SKY} ticks={4} />
);

export default ThursdayRadarDial;
