/**
 * Prepends deprecation notice to legacy user-profile page-spec bodies.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'docs/apps/web/spec/pages/user-profile');

const NOTICE =
  '> **Deprecated:** Legacy Waivio React Router spec. Use [profile-shell.md](../../profile-shell.md) and App Router route specs under `routes/*.md` instead.\n\n';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name === 'page-spec.md' || e.name === 'query-params-audit.md')
      out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('**Deprecated:** Legacy Waivio')) continue;
  if (!text.includes('status: deprecated')) continue;
  const end = text.indexOf('\n---', 4);
  if (end < 0) continue;
  const insertAt = end + 4 + (text[end + 4] === '\r' ? 2 : 1);
  const next = text.slice(0, insertAt) + '\n' + NOTICE + text.slice(insertAt).replace(/^\n/, '');
  fs.writeFileSync(file, next, 'utf8');
  changed += 1;
}

// eslint-disable-next-line no-console
console.log(`deprecation notices added: ${changed}`);
