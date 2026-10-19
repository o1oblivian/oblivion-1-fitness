import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { buildAppleClientSecret, readAppleRevokeConfig, revokeAppleSignIn } from './appleRevoke';

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

const env = {
  APPLE_TEAM_ID: 'TEAM123456',
  APPLE_KEY_ID: 'KEY1234567',
  APPLE_PRIVATE_KEY: pem.replace(/\n/g, '\\n'),
} as unknown as NodeJS.ProcessEnv;

describe('appleRevoke', () => {
  it('stays off until the Apple key is configured', async () => {
    expect(readAppleRevokeConfig({} as NodeJS.ProcessEnv)).toBeNull();
    const fetchImpl = vi.fn();
    const result = await revokeAppleSignIn('code', {
      env: {} as NodeJS.ProcessEnv,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toBe('not-configured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('signs a client secret Apple can verify', () => {
    const config = readAppleRevokeConfig(env);
    if (!config) throw new Error('The test environment should configure Apple sign in.');
    expect(config.clientId).toBe('com.o1fc.fitness');
    const jwt = buildAppleClientSecret(config, 1_000);
    const [header, claims, signature] = jwt.split('.');
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toMatchObject({
      alg: 'ES256',
      kid: 'KEY1234567',
    });
    expect(JSON.parse(Buffer.from(claims, 'base64url').toString())).toMatchObject({
      iss: 'TEAM123456',
      sub: 'com.o1fc.fitness',
      aud: 'https://appleid.apple.com',
      exp: 1_300,
    });
    const ok = verify(
      'sha256',
      Buffer.from(`${header}.${claims}`),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(signature, 'base64url'),
    );
    expect(ok).toBe(true);
  });

  it('exchanges the code, then revokes the refresh token', async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body) });
      return url.endsWith('/auth/token')
        ? new Response(JSON.stringify({ refresh_token: 'r-token', access_token: 'a-token' }))
        : new Response('', { status: 200 });
    });
    const result = await revokeAppleSignIn('auth-code', {
      env,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toBe('revoked');
    expect(calls.map((c) => c.url)).toEqual([
      'https://appleid.apple.com/auth/token',
      'https://appleid.apple.com/auth/revoke',
    ]);
    expect(calls[0].body).toContain('code=auth-code');
    expect(calls[1].body).toContain('token=r-token');
    expect(calls[1].body).toContain('token_type_hint=refresh_token');
  });

  it('reports a failure without throwing when Apple rejects the code', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 400 }));
    const result = await revokeAppleSignIn('bad', {
      env,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toBe('failed');
  });
});
