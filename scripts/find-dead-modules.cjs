// Lists src modules that no other src module imports (static or dynamic).
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'src');
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(full);
  }
})(root);

const importRe = /(?:from\s+|import\s*\(\s*|import\s+)['"](\.[^'"]+)['"]/g;
const used = new Set();
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  for (const match of src.matchAll(importRe)) {
    const base = path.resolve(path.dirname(file), match[1]);
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
      used.add(path.normalize(candidate));
    }
  }
}

const entries = new Set(['main.tsx', 'vite-env.d.ts'].map((f) => path.join(root, f)));
const globLoaded = (f) => path.relative(root, f).startsWith('devMocks');
const dead = files.filter((f) => !used.has(path.normalize(f)) && !entries.has(f) && !globLoaded(f));
for (const f of dead) console.log(path.relative(root, f));
console.log(`\n${dead.length} unreferenced of ${files.length} modules`);
