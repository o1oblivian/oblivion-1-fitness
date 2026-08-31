import React, { useMemo } from 'react';
import { VaultMediaItem, formatVaultMediaTitle } from './MediaVaultModal';
import { ApplePhotoGalleryViewer, AppleGalleryItem } from './ApplePhotoGalleryViewer';

interface SwipeableMediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  items: VaultMediaItem[];
  startIndex: number;
  ownerName: string;
  onToggleFavorite?: (item: VaultMediaItem) => void;
  onToggleBuddy?: (item: VaultMediaItem) => void;
  onDelete?: (item: VaultMediaItem) => void;
}

export const SwipeableMediaViewer: React.FC<SwipeableMediaViewerProps> = ({
  isOpen,
  onClose,
  items,
  startIndex,
  ownerName,
  onToggleFavorite,
  onToggleBuddy,
  onDelete,
}) => {
  const galleryItems: AppleGalleryItem[] = useMemo(() => {
    return items.map((m) => ({
      id: m.id,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      type: m.type,
      title: formatVaultMediaTitle(m),
      date: m.date,
      category: m.category,
      coachNote: m.coachNote,
      show_on_buddy: m.show_on_buddy,
      likes: m.likes,
      rawBlob: m.rawBlob,
    }));
  }, [items]);

  if (!isOpen || items.length === 0) return null;

  return (
    <ApplePhotoGalleryViewer
      isOpen={isOpen}
      onClose={onClose}
      items={galleryItems}
      initialIndex={startIndex}
      ownerName={ownerName}
      onToggleBuddy={
        onToggleBuddy
          ? (galleryItem) => {
              const orig = items.find((i) => i.id === galleryItem.id);
              if (orig) onToggleBuddy(orig);
            }
          : undefined
      }
      onToggleFavorite={
        onToggleFavorite
          ? (galleryItem) => {
              const orig = items.find((i) => i.id === galleryItem.id);
              if (orig) onToggleFavorite(orig);
            }
          : undefined
      }
      onDelete={
        onDelete
          ? (galleryItem) => {
              const orig = items.find((i) => i.id === galleryItem.id);
              if (orig) onDelete(orig);
            }
          : undefined
      }
    />
  );
};

export default SwipeableMediaViewer;
