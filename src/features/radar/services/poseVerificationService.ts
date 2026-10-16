import { supabase } from '../../../services/supabaseClient';
import { apiFetch } from '../../../services/apiBase';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';

export interface PoseChallenge {
  id: string;
  prompt: string;
  instruction: string;
}

export interface PoseVerificationResult {
  match: boolean;
  posePassed: boolean;
  confidence: number;
  reason: string;
  isVerified: boolean;
}

export const TACTICAL_POSE_CHALLENGES: PoseChallenge[] = [
  {
    id: 'pose_eyebrow',
    prompt: 'Hold 2 fingers touching right eyebrow',
    instruction: 'Place your index & middle finger directly touching your right eyebrow.',
  },
  {
    id: 'pose_chin_thumbsup',
    prompt: 'Thumbs up directly below chin',
    instruction: 'Give a clear thumbs-up gesture centered directly underneath your chin.',
  },
  {
    id: 'pose_peace_eye',
    prompt: 'Peace sign tilted next to left eye',
    instruction: 'Make a V-peace sign and tilt it right beside your left temple / eye.',
  },
  {
    id: 'pose_touch_ear',
    prompt: 'Touch left ear with right hand',
    instruction: 'Reach across with your right hand and hold your left earlobe.',
  },
  {
    id: 'pose_fist_forehead',
    prompt: 'Fist salute touching forehead',
    instruction: 'Clench a tactical fist and press knuckles against the center of your forehead.',
  },
];

export function getRandomPoseChallenge(): PoseChallenge {
  const index = Math.floor(Math.random() * TACTICAL_POSE_CHALLENGES.length);
  return TACTICAL_POSE_CHALLENGES[index];
}

const FAILED: PoseVerificationResult = {
  match: false,
  posePassed: false,
  confidence: 0,
  reason: 'Could not reach verification. Check your connection and try again.',
  isVerified: false,
};

export async function verifyAthletePose(selfieBase64: string, challenge: PoseChallenge): Promise<PoseVerificationResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ...FAILED, reason: 'Sign in to verify your profile.' };
    const res = await apiFetch('/api/vision/verify-pose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ selfieBase64, challengePrompt: challenge.prompt }),
    });
    const body = (await res.json().catch(() => null)) as Partial<PoseVerificationResult> | null;
    if (!body) return FAILED;
    const result: PoseVerificationResult = {
      match: body.match === true,
      posePassed: body.posePassed === true,
      confidence: Number(body.confidence) || 0,
      reason: typeof body.reason === 'string' && body.reason ? body.reason : FAILED.reason,
      isVerified: res.ok && body.isVerified === true,
    };
    if (result.isVerified) useBuddyProfileStore.getState().updateBuddyProfile({ isVerifiedBadge: true });
    return result;
  } catch {
    return FAILED;
  }
}
