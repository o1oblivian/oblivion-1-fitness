export interface VaultMediaItem {
  id: string;
  title: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl: string;
  category: 'Photos' | 'Videos' | 'Physique' | 'Form Video' | 'PR Clip' | 'Tutorial' | 'Transformation';
  date: string;
  likes: number;
  coachNote?: string;
  tags?: string[];
  specialization?: string;
  show_on_buddy?: boolean;
  rawBlob?: Blob | File;
}

export function formatVaultMediaTitle(item: VaultMediaItem): string {
  if (item.title && item.title.trim()) return item.title;
  return item.type === 'video' ? 'Form Check Video' : 'Athlete Progress Shot';
}
