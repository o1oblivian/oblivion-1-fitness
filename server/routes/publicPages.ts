import express, { type Express } from 'express';
import path from 'path';

/** Static files plus the privacy, delete-account and terms pages that Google Play and Apple review. */
export function registerPublicPages(app: Express): void {
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  app.get(['/privacy', '/privacy.html', '/privacy-policy', '/privacy-policy.html'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(publicDir, 'privacy.html'));
  });

  app.get(
    ['/delete-account', '/delete-account.html', '/account-deletion', '/data-deletion'],
    (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(path.join(publicDir, 'delete-account.html'));
    },
  );

  app.get(['/terms', '/terms.html', '/terms-of-service', '/terms-of-use', '/eula'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(publicDir, 'terms.html'));
  });
}
