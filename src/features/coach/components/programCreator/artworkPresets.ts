export interface ArtworkPreset {
  id: string;
  label: string;
  url: string;
}

export const O1_PRESETS: ArtworkPreset[] = [
  {
    id: 'preset-hypertrophy',
    label: 'Hypertrophy',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'preset-strength',
    label: 'Heavy Strength',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'preset-hyrox',
    label: 'HYROX & Sled',
    url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'preset-combat',
    label: 'Combat & Boxing',
    url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'preset-mobility',
    label: 'Mobility & Flow',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'preset-calisthenics',
    label: 'Calisthenics',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
  },
];
