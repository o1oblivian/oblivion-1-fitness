import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = process.cwd();
const GUARD_FILES = ['.cursor/locked-files.json', '.cursor/hooks.json', '.cursor/hooks/lock-guard.mjs'];
const SHELL_WRITES = /(WriteAll(Text|Bytes|Lines)|Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Rename-Item|Copy-Item|\bdel\b|\brm\b|\bmv\b|\bcp\b|\bsed\b|\bgit\s+(checkout|restore|reset|stash|rm|mv|apply)\b|(?<![0-9&])>>?(?!&))/i;

const norm = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();

function lockedList() {
  try {
    const data = JSON.parse(readFileSync(resolve(root, '.cursor/locked-files.json'), 'utf8'));
    return Array.isArray(data.locked) ? data.locked.map(norm) : [];
  } catch {
    return [];
  }
}

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

function asRepoPath(p) {
  const abs = resolve(root, p);
  return norm(relative(root, abs));
}

function respond(body) {
  process.stdout.write(JSON.stringify(body));
  process.exit(0);
}

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  input = {};
}

const locked = lockedList();
const isShell = typeof input.command === 'string' && !input.tool_input;

if (isShell) {
  const cmd = input.command;
  const lower = norm(cmd);
  if (SHELL_WRITES.test(cmd)) {
    const guard = GUARD_FILES.find((f) => lower.includes(f));
    if (guard) {
      respond({
        permission: 'ask',
        user_message: `This command touches the release lock (${guard}). Approve only if you asked to change the lock.`,
        agent_message: `Release lock: ${guard} needs the owner's approval.`,
      });
    }
    const hit = locked.find((f) => lower.includes(f) || lower.includes(f.split('/').pop()));
    if (hit) {
      respond({
        permission: 'deny',
        user_message: `Blocked: ${hit} is locked as tested and working.`,
        agent_message: `${hit} is on the release lock list (.cursor/locked-files.json). Do not modify it. Ask the owner to unlock it first.`,
      });
    }
  }
  respond({ permission: 'allow' });
}

const paths = strings(input.tool_input ?? {})
  .filter((s) => s.length < 400 && /[\\/]|\.\w{1,6}$/.test(s) && !/\n/.test(s))
  .map(asRepoPath);

const guard = paths.find((p) => GUARD_FILES.includes(p));
if (guard) {
  respond({
    permission: 'ask',
    user_message: `This edit changes the release lock (${guard}). Approve only if you asked to lock or unlock something.`,
    agent_message: `Release lock: ${guard} needs the owner's approval.`,
  });
}

const hit = paths.find((p) => locked.includes(p));
if (hit) {
  respond({
    permission: 'deny',
    user_message: `Blocked: ${hit} is locked as tested and working.`,
    agent_message: `${hit} is on the release lock list (.cursor/locked-files.json). Do not modify it. Ask the owner to unlock it first.`,
  });
}

respond({ permission: 'allow' });
