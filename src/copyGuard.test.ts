import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const BANNED = /\b(?:[Cc]loud|CLOUD|[Gg]emini|GEMINI|AI|A\.I\.)\b/;
const SKIP_LINE = /console\.|^\s*import\s|\bfrom\s+['"]|^\s*export\s+\*/;
const IDENT_LIKE = /^[a-z0-9_.\-/]+$/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

function visibleText(line: string): string[] {
  const out: string[] = [];
  for (const m of line.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    if (!IDENT_LIKE.test(m[2])) out.push(m[2]);
  }
  for (const m of line.matchAll(/>([^<>{}]+)</g)) out.push(m[1]);
  return out;
}

describe('user-facing copy', () => {
  it('detects banned words in strings and JSX text', () => {
    const flagged = (line: string) => visibleText(line).some((t) => BANNED.test(t));
    expect(flagged(`<p>Cloud archive failed</p>`)).toBe(true);
    expect(flagged(`setError('Read by Gemini Vision.')`)).toBe(true);
    expect(flagged(`label: "AI Coach"`)).toBe(true);
    expect(flagged(`source === 'cloud'`)).toBe(false);
    expect(flagged(`<p>Backed up to your account.</p>`)).toBe(false);
  });

  it('never mentions cloud, Gemini or AI', () => {
    const hits: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const code = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ''))
        .replace(/(^|\s)\/\/.*$/gm, '$1');
      code.split('\n').forEach((line, i) => {
        if (SKIP_LINE.test(line)) return;
        for (const text of visibleText(line)) {
          if (BANNED.test(text)) hits.push(`${relative(SRC, file)}:${i + 1}  ${text.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });
});
