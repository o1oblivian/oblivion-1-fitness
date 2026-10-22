/**
 * The app's colours as plain strings, for the places a Tailwind class cannot reach: canvas
 * drawing, SVG attributes and inline styles. Each value matches a token in `src/index.css`
 * (`--color-o1-*`); keep the two in step. Class names use the CSS tokens, never these.
 */
export const COLOR = {
  canvas: '#000000',
  card: '#0e0e0e',
  surface: '#111113',
  well: '#161616',
  sheet: '#161618',
  /** Thin dividers on sheets and drawers. */
  hairline: '#1f1f1f',
  raised: '#1a1a1a',
  /** The empty part of a ring or gauge. */
  track: '#1f1f23',

  /** Pure white, only where a design calls for it. Text uses `bone`. */
  pure: '#ffffff',
  text: '#eae8df',
  bone: '#f2efe6',
  stone: '#d9d3c1',
  muted: '#c4bda8',
  faint: '#a39b86',
  dim: '#7a7466',

  crimson: '#c4121a',
  crimsonHover: '#a30f16',
  yellow: '#f7c600',
  yellowDeep: '#c9a000',
  olive: '#6b8f5e',
  teal: '#4f8f9a',
  sky: '#0284c7',
  emerald: '#10b981',
  emeraldDeep: '#059669',

  /** Shades used by one screen each, named so they are not buried as hex. */
  ash: '#cfccc1',
  off: '#3f3f46',
  dialInk: '#f4f2ea',
  dialCrimson: '#e0262e',
  dialSky: '#2aa3e0',
} as const;

/** Third-party brand colours for share targets. They are not ours to change. */
export const BRAND = {
  whatsapp: '#25d366',
  telegram: '#229ed9',
  x: '#111111',
} as const;

export type ColorName = keyof typeof COLOR;
