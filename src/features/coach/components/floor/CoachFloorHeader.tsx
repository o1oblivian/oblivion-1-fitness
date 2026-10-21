import { useState } from 'react';
import { tactileEngine } from '../../../../services/tactileEngine';
import type { StorefrontStats } from '../../../reels/services/coachStorefront';
import { CoachCard, formatHandle, toExploreCoach } from '../../services/coachDirectory';
import {
  CoachProfileHeader,
  ProfileActionButton,
  compactCount,
  ratingLabel,
} from '../profile/CoachProfileHeader';
import { CoachProfileEditSheet } from '../profile/CoachProfileEditSheet';

interface CoachFloorHeaderProps {
  coachId: string;
  /** The coach's public card; null until loaded or before the first save. */
  card: CoachCard | null;
  /** Display name: the card's, else the account's. */
  name: string;
  storefront: StorefrontStats;
  /** How many films the coach has, and the newest one's id (opens on avatar tap). */
  filmCount: number;
  firstFilmId?: string;
  /** Client count to show, or "--" while the roster loads. */
  clientCount: string;
  onCardChange: (card: CoachCard) => void;
  onStorefrontChange: (changes: Partial<StorefrontStats>) => void;
  onOpenReel: (reelId: string) => void;
  onOpenVault: () => void;
  onCreateProgram: () => void;
  onOpenWorkout: () => void;
  onShowClients: () => void;
  onShowToast?: (msg: string) => void;
}

/** The coach's profile header and the sheet that edits it. */
export function CoachFloorHeader({
  coachId,
  card,
  name,
  storefront,
  filmCount,
  firstFilmId,
  clientCount,
  onCardChange,
  onStorefrontChange,
  onOpenReel,
  onOpenVault,
  onCreateProgram,
  onOpenWorkout,
  onShowClients,
  onShowToast,
}: CoachFloorHeaderProps) {
  const [editing, setEditing] = useState(false);
  const explore = card ? toExploreCoach(card) : null;
  const specialtyLine = [card?.specialties.slice(0, 3).join(' · '), explore?.rate]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className="px-1">
        <CoachProfileHeader
          name={name}
          handle={formatHandle(card?.handle)}
          avatar={card?.avatar}
          specialty={specialtyLine}
          bio={card?.bio}
          verified={card?.verified}
          hasStory={filmCount > 0}
          onAvatarPress={firstFilmId ? () => onOpenReel(firstFilmId) : undefined}
          onAddClip={onOpenVault}
          onEdit={() => {
            tactileEngine.triggerSelectionBuzz();
            setEditing(true);
          }}
          stats={[
            { label: 'Followers', value: compactCount(storefront.followers) },
            { label: 'Clients', value: clientCount, onPress: onShowClients },
            {
              label: storefront.reviewCount > 0 ? `${storefront.reviewCount} reviews` : 'Rating',
              value: ratingLabel(storefront.rating),
            },
          ]}
          actions={
            <>
              <ProfileActionButton label="Program" onPress={onCreateProgram} />
              <ProfileActionButton label="Daily Dispatch" primary onPress={onOpenWorkout} />
            </>
          }
        />
        {!card ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-dashed border-white/[0.07] text-o1-caption font-semibold text-o1-muted"
          >
            Set up your public coach card so athletes can find you
          </button>
        ) : null}
      </div>

      <CoachProfileEditSheet
        open={editing}
        initial={{
          name,
          handle: card?.handle || '',
          bio: card?.bio || '',
          avatar: card?.avatar || '',
          specialties: card?.specialties || [],
          accepting: card?.accepting ?? true,
        }}
        stats={storefront}
        onClose={() => setEditing(false)}
        onError={(msg) => onShowToast?.(msg)}
        onSaved={(next, front) => {
          onCardChange({
            id: coachId,
            hourlyRate: card?.hourlyRate ?? null,
            monthlyRate:
              front.monthlyPriceCents != null
                ? front.monthlyPriceCents / 100
                : (card?.monthlyRate ?? null),
            verified: card?.verified ?? false,
            name: next.name,
            handle: next.handle,
            avatar: next.avatar,
            bio: next.bio,
            specialties: next.specialties,
            accepting: next.accepting,
          });
          onStorefrontChange(front);
          setEditing(false);
          onShowToast?.('Profile saved');
        }}
      />
    </>
  );
}
