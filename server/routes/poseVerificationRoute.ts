import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { getSupabaseAdmin } from '../lib/stripeLedger';

const PASS_CONFIDENCE = 0.85;
const MAX_IMAGE_CHARS = 6_000_000;

function rejected(res: Response, reason: string, status = 200) {
  return res.status(status).json({ match: false, posePassed: false, confidence: 0, reason, isVerified: false });
}

function splitDataUrl(value: string): { mimeType: string; data: string } | null {
  const hit = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(value);
  if (hit) return { mimeType: hit[1], data: hit[2] };
  return null;
}

async function loadProfilePhoto(url: string): Promise<{ mimeType: string; data: string } | null> {
  const inline = splitDataUrl(url);
  if (inline) return inline;
  const storageBase = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  if (!storageBase.startsWith('https://') || !url.startsWith(`${storageBase}/storage/v1/`)) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    if (!mimeType.startsWith('image/')) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_IMAGE_CHARS) return null;
    return { mimeType, data: bytes.toString('base64') };
  } catch {
    return null;
  }
}

export async function handleVerifyPose(req: Request, res: Response, getGenAI: () => GoogleGenAI | null) {
  try {
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const admin = getSupabaseAdmin();
    if (!admin) return rejected(res, 'Verification is not available right now.', 503);
    if (!token) return rejected(res, 'Sign in to verify your profile.', 401);
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    const uid = auth?.user?.id;
    if (authError || !uid) return rejected(res, 'Sign in to verify your profile.', 401);

    const { selfieBase64, challengePrompt } = req.body || {};
    const selfie = typeof selfieBase64 === 'string' && selfieBase64.length <= MAX_IMAGE_CHARS ? splitDataUrl(selfieBase64) : null;
    if (!selfie) return rejected(res, 'Take a selfie to continue.', 400);
    const prompt = typeof challengePrompt === 'string' ? challengePrompt.slice(0, 120) : '';
    if (!prompt) return rejected(res, 'Pose challenge missing.', 400);

    const { data: profile } = await admin
      .from('buddy_profiles')
      .select('avatar_url,image_url')
      .eq('id', uid)
      .maybeSingle();
    const photoUrl = String(profile?.avatar_url || profile?.image_url || '');
    const avatar = photoUrl ? await loadProfilePhoto(photoUrl) : null;
    if (!avatar) return rejected(res, 'Save a profile photo to your Buddy card first.', 400);

    const genAI = getGenAI();
    if (!genAI) return rejected(res, 'Verification is not available right now. Try again later.', 503);

    const instructions = `You verify gym-partner profiles for Oblivion 1 Fitness Club.
Image A is the saved profile photo. Image B is a live selfie.
Answer two questions:
1. Is the same person in both photos?
2. In Image B, is the person clearly doing this pose: "${prompt}"?
Reply with JSON only:
{"match": boolean, "posePassed": boolean, "confidence": number between 0 and 1, "reason": "one short sentence"}`;

    let parsed: { match?: unknown; posePassed?: unknown; confidence?: unknown; reason?: unknown } | null = null;
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: avatar },
              { inlineData: selfie },
              { text: instructions },
            ],
          },
        ],
      });
      const jsonMatch = (response.text || '').match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch (aiErr) {
      console.warn('[PoseVerification] vision call failed:', aiErr);
    }
    if (!parsed) return rejected(res, 'Verification could not read the photos. Try again.', 503);

    const match = parsed.match === true;
    const posePassed = parsed.posePassed === true;
    const raw = Number(parsed.confidence);
    const confidence = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0;
    const reason = typeof parsed.reason === 'string' && parsed.reason.trim() ? parsed.reason.trim().slice(0, 200) : 'Check complete.';
    const isVerified = match && posePassed && confidence >= PASS_CONFIDENCE;

    if (isVerified) {
      const { error } = await admin
        .from('buddy_profiles')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('id', uid);
      if (error) {
        console.error('[PoseVerification] badge save failed:', error.message);
        return rejected(res, 'You passed, but the badge did not save. Try again.', 500);
      }
    }

    return res.json({ match, posePassed, confidence, reason, isVerified });
  } catch (err) {
    console.error('Error in /api/vision/verify-pose:', err);
    return rejected(res, 'Verification failed. Try again.', 500);
  }
}
