import type { Express } from 'express';
import { createClient } from '@supabase/supabase-js';
import { deleteAccountData } from '../lib/accountDeletion';

export function registerAccountRoutes(app: Express): void {
  app.post('/api/account/delete', async (req, res) => {
    try {
      const authHeader = String(req.headers.authorization || '');
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }
      if (!supabaseUrl || !serviceKey) {
        return res.status(503).json({ error: 'Account deletion is not configured.' });
      }
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      const uid = userData?.user?.id;
      if (userErr || !uid) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }

      const code = req.body?.appleAuthorizationCode;
      const appleAuthorizationCode =
        typeof code === 'string' && code.length > 0 && code.length <= 4096 ? code : undefined;
      const result = await deleteAccountData(uid, { appleAuthorizationCode });
      if (!result.ok) return res.status(result.status).json({ error: result.error });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[account/delete] failed:', err?.message);
      return res.status(500).json({ error: 'Account deletion failed. Try again.' });
    }
  });
}
