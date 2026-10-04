import React from 'react';
import { PlaneTakeoff } from 'lucide-react';

/**
 * Premium Plane Icon (🛫)
 * Refined aerospace departure vector with ascending angle and runway vector baseline.
 * Flawless, pixel-perfect scaling across all device resolutions and dual themes.
 */
export const PremiumPlaneIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <PlaneTakeoff
    className={className}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

/**
 * Tactical Place Beacon Icon
 * Precision aerodynamic gym & facility beacon with concentric reticle aperture.
 * Distinctive, high-end alternative to generic consumer map pins.
 */
export const TacticalPlaceBeaconIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

