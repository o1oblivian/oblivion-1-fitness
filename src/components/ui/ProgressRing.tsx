import React from 'react';

export interface ProgressRingConfig {
  radius: number;
  strokeWidth?: number;
  progress?: number; // 0 to 1, or percentage (0 to 100)
  offsetFraction?: number; // e.g. 0.28, 0.45
  color: string;
  trackColor?: string;
  glowColor?: string;
  glowRadius?: number;
  strokeLinecap?: 'round' | 'butt' | 'square';
}

export interface ProgressRingProps extends ProgressRingConfig {
  size?: number; // SVG viewBox dimension, default 160
  center?: { x: number; y: number };
  className?: string;
  showTrack?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  radius,
  strokeWidth = 8,
  progress,
  offsetFraction,
  color,
  trackColor,
  glowColor,
  glowRadius = 10,
  strokeLinecap = 'round',
  size = 220,
  center,
  className = '',
  showTrack = true,
}) => {
  const cx = center?.x ?? size / 2;
  const cy = center?.y ?? size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate dash offset
  let dashOffset = 0;
  if (typeof offsetFraction === 'number') {
    dashOffset = circumference * offsetFraction;
  } else if (typeof progress === 'number') {
    const normalizedProgress = progress > 1 ? progress / 100 : progress;
    dashOffset = circumference * (1 - Math.max(0, Math.min(1, normalizedProgress)));
  }

  const effectiveTrackColor =
    trackColor ||
    (color.startsWith('#')
      ? `${color}26` // ~15% opacity hex
      : color.replace(')', ', 0.15)').replace('rgb', 'rgba'));

  const effectiveGlow = glowColor || color;

  return (
    <g className={className}>
      {/* Background Track */}
      {showTrack && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={effectiveTrackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      )}

      {/* Progress Arc with Glowing Drop Shadow */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{
          filter: `drop-shadow(0 0 ${glowRadius}px ${effectiveGlow})`,
        }}
      />
    </g>
  );
};

export interface ConcentricRingsProps {
  rings: ProgressRingConfig[];
  size?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ConcentricRings: React.FC<ConcentricRingsProps> = ({
  rings,
  size = 220,
  className = '',
  children,
}) => {
  return (
    <svg
      className={`w-full h-full -rotate-90 animate-in zoom-in-95 duration-300 ${className}`}
      viewBox={`0 0 ${size} ${size}`}
    >
      {rings.map((ring, idx) => (
        <ProgressRing
          key={`${ring.radius}-${idx}`}
          size={size}
          {...ring}
        />
      ))}
      {children}
    </svg>
  );
};
