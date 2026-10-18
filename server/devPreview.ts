import type { Express } from 'express';
import { createRequire } from 'module';

/** Development only: loads sample coach and athlete rows into this phone's local storage. */
export function registerDevPreview(app: Express): void {
  const require = createRequire(import.meta.url);
  app.get('/preview-look', (_req, res) => {
    const clearing = _req.query.clear === '1';
    const previewPath = require.resolve('../scripts/preview.cjs');
    delete require.cache[previewPath];
    const pack = clearing ? null : require('../scripts/preview.cjs').bundle();
    const payload = JSON.stringify(pack || {}).replace(/</g, '\\u003c');
    res.type('html')
      .send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview</title><body style="background:#000;color:#fff;font-family:sans-serif;padding:24px"><p>${clearing ? 'Preview rows removed. Returning to the app.' : 'Preview rows saved on this phone. Returning to the app.'}</p><script>
        const pack = ${payload};
        const drop = (key) => {
          const prev = JSON.parse(localStorage.getItem(key) || '[]');
          const list = Array.isArray(prev) ? prev.filter((row) => !String(row && row.id || '').startsWith('preview-')) : [];
          if (list.length) localStorage.setItem(key, JSON.stringify(list));
          else localStorage.removeItem(key);
        };
        if (${clearing ? 'true' : 'false'}) {
          ['o1fc_custom_coach_clients','o1fc_day_checkins_v1','o1_finished_workouts_v1','o1_coach_custom_programs','o1_coach_notes_local','o1_coach_messages_local'].forEach(drop);
          localStorage.removeItem('o1_assigned_local');
          const backup = localStorage.getItem('o1_preview_link_backup');
          if (backup) localStorage.setItem('o1_my_coach', backup); else localStorage.removeItem('o1_my_coach');
          localStorage.removeItem('o1_preview_link_backup');
        } else {
          const keep = (key, rows) => {
            const prev = JSON.parse(localStorage.getItem(key) || '[]');
            const list = Array.isArray(prev) ? prev.filter((row) => !String(row && row.id || '').startsWith('preview-')) : [];
            localStorage.setItem(key, JSON.stringify(rows.concat(list)));
          };
          keep('o1fc_custom_coach_clients', pack.athletes);
          const day = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
          keep('o1fc_day_checkins_v1', pack.checkins.map((row) => Object.assign({}, row, { date: day })));
          keep('o1_finished_workouts_v1', pack.finished);
          keep('o1_coach_custom_programs', pack.programs);
          keep('o1_coach_notes_local', pack.notes);
          keep('o1_coach_messages_local', pack.messages);
          if (localStorage.getItem('o1_preview_link_backup') == null) localStorage.setItem('o1_preview_link_backup', localStorage.getItem('o1_my_coach') || '');
          const photo = localStorage.getItem('o1_profile_avatar_url') || '';
          localStorage.setItem('o1_my_coach', JSON.stringify(Object.assign({}, pack.coach, { avatar: photo })));
          localStorage.setItem('o1_assigned_local', JSON.stringify(pack.assigned));
        }
        location.replace('/');
      </script></body>`);
  });
}
