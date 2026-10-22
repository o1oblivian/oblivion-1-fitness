import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Keeps the design system honest. Colours come from the `--color-o1-*` tokens in index.css (classes)
 * or `COLOR` in theme/colors.ts (canvas, SVG, inline styles). These checks fail the build when a
 * stock Tailwind colour, a misleading font class or a loose hex value sneaks back in.
 */
const SRC = join(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const files = sourceFiles(SRC).map((path) => ({
  path: relative(SRC, path).split(sep).join('/'),
  text: readFileSync(path, 'utf8'),
}));
const css = readFileSync(join(SRC, 'index.css'), 'utf8');

/** Files whose job is to define colours as data, or that run before the stylesheet exists. */
const HEX_ALLOWED = new Set([
  'theme/colors.ts',
  'components/ui/towerThemes.ts',
  'features/fuel/data/dietProtocols.ts',
  'main.tsx',
]);

const COLOUR_PREFIX =
  'text|bg|border|ring|fill|stroke|from|to|via|divide|outline|decoration|shadow|accent|caret|placeholder';

function offenders(pattern: RegExp, allowed: Set<string> = new Set()): string[] {
  return files.flatMap(({ path, text }) =>
    allowed.has(path) ? [] : [...text.matchAll(pattern)].map((m) => `${path}: ${m[0]}`),
  );
}

describe('design tokens', () => {
  it('uses no stock Tailwind palette classes', () => {
    const stock = new RegExp(
      `(?<![\\w-])(?:${COLOUR_PREFIX})-(?:red|amber|emerald|sky|neutral|zinc|slate|orange|violet|purple|green|blue|cyan|indigo|rose|yellow|lime|teal|pink|fuchsia|stone|gray)-\\d+`,
      'g',
    );
    expect(offenders(stock)).toEqual([]);
  });

  it('has no hex colours in class names', () => {
    const arbitrary = new RegExp(`(?<![\\w-])(?:${COLOUR_PREFIX})-\\[#[0-9a-fA-F]{3,8}\\]`, 'g');
    expect(offenders(arbitrary, HEX_ALLOWED)).toEqual([]);
  });

  it('keeps loose hex values in the colour files', () => {
    expect(offenders(/#[0-9a-fA-F]{6}\b/g, HEX_ALLOWED)).toEqual([]);
  });

  it('does not call a proportional font "mono"', () => {
    expect(offenders(/(?<![\w-])font-(?:mono|telemetry)(?![\w-])/g)).toEqual([]);
  });

  it('only uses o1 colour classes that exist in the theme', () => {
    const defined = new Set(
      [...css.matchAll(/--(?:color|text)-o1-([a-z0-9-]+):/g)].map((m) => m[1]),
    );
    const used = new Set<string>();
    const pattern = new RegExp(`(?<![\\w-])(?:${COLOUR_PREFIX})-o1-([a-z0-9-]+)(?![\\w-])`, 'g');
    for (const { text } of files) {
      for (const m of text.matchAll(pattern)) used.add(m[1]);
    }
    expect([...used].filter((name) => !defined.has(name)).sort()).toEqual([]);
  });
});
