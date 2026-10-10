import { O1_PRESETS } from '../coach/components/programCreator/artworkPresets';

const COVERS = O1_PRESETS.filter((preset) =>
  ['preset-hypertrophy', 'preset-strength', 'preset-hyrox', 'preset-mobility'].includes(preset.id),
);

export function reelCover(id: string, thumb?: string): string {
  const raw = (thumb || '').trim();
  const broken = !raw || /gym-tile|\.svg($|\?)/i.test(raw);
  if (!broken) return raw;
  let slot = 0;
  for (let i = 0; i < id.length; i += 1) slot = (slot + id.charCodeAt(i)) % COVERS.length;
  return COVERS[slot]?.url || COVERS[0].url;
}

export function nextReelCover(current: string): string {
  const index = COVERS.findIndex((preset) => current.includes(preset.url.slice(0, 48)));
  return COVERS[(index + 1) % COVERS.length].url;
}
