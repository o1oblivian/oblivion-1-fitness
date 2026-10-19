import { createPrivateKey, sign } from 'node:crypto';

/**
 * Apple requires an app that offers Sign in with Apple to revoke the user's Apple tokens when the
 * account is deleted. This signs a short-lived client secret with the team's key, trades the
 * one-time authorization code for a refresh token, and revokes it.
 *
 * Needs APPLE_TEAM_ID, APPLE_KEY_ID and APPLE_PRIVATE_KEY (the .p8 file contents) on the server.
 * APPLE_CLIENT_ID is the app's bundle ID and defaults to com.o1fc.fitness.
 */

const APPLE_AUDIENCE = 'https://appleid.apple.com';
const DEFAULT_CLIENT_ID = 'com.o1fc.fitness';
const REQUEST_TIMEOUT_MS = 10_000;

export interface AppleRevokeConfig {
  teamId: string;
  keyId: string;
  privateKey: string;
  clientId: string;
}

export function readAppleRevokeConfig(
  env: NodeJS.ProcessEnv = process.env,
): AppleRevokeConfig | null {
  const teamId = String(env.APPLE_TEAM_ID || '').trim();
  const keyId = String(env.APPLE_KEY_ID || '').trim();
  // Hosting dashboards often store the key on one line with literal \n.
  const privateKey = String(env.APPLE_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n')
    .trim();
  if (!teamId || !keyId || !privateKey) return null;
  return {
    teamId,
    keyId,
    privateKey,
    clientId: String(env.APPLE_CLIENT_ID || '').trim() || DEFAULT_CLIENT_ID,
  };
}

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function buildAppleClientSecret(config: AppleRevokeConfig, nowSeconds?: number): string {
  const iat = nowSeconds ?? Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: config.keyId, typ: 'JWT' };
  const claims = {
    iss: config.teamId,
    iat,
    exp: iat + 300,
    aud: APPLE_AUDIENCE,
    sub: config.clientId,
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  const signature = sign('sha256', Buffer.from(signingInput), {
    key: createPrivateKey(config.privateKey),
    dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${base64Url(signature)}`;
}

async function postForm(
  fetchImpl: typeof fetch,
  path: string,
  form: Record<string, string>,
): Promise<Response> {
  return fetchImpl(`${APPLE_AUDIENCE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form).toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export type AppleRevokeResult = 'revoked' | 'not-configured' | 'failed';

/** Never throws: deleting the account must not depend on Apple being reachable. */
export async function revokeAppleSignIn(
  authorizationCode: string,
  options: { env?: NodeJS.ProcessEnv; fetchImpl?: typeof fetch } = {},
): Promise<AppleRevokeResult> {
  const config = readAppleRevokeConfig(options.env);
  if (!config) return 'not-configured';
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const clientSecret = buildAppleClientSecret(config);
    const tokenRes = await postForm(fetchImpl, '/auth/token', {
      client_id: config.clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: 'authorization_code',
    });
    if (!tokenRes.ok) return 'failed';
    const tokens = (await tokenRes.json().catch(() => ({}))) as {
      refresh_token?: string;
      access_token?: string;
    };
    const token = tokens.refresh_token || tokens.access_token;
    if (!token) return 'failed';
    const revokeRes = await postForm(fetchImpl, '/auth/revoke', {
      client_id: config.clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: tokens.refresh_token ? 'refresh_token' : 'access_token',
    });
    return revokeRes.ok ? 'revoked' : 'failed';
  } catch {
    return 'failed';
  }
}
