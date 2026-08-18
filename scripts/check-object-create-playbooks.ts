import { readdir, readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { OBJECT_TYPE_REGISTRY } from '../libs/core/src/object-type-registry/object-type-registry';
import { parseKnowledgeFile } from '../libs/knowledge/src/parser/parse-knowledge-file';

const ROOT = path.resolve(process.cwd());
const PLAYBOOK_DIR = path.join(ROOT, 'docs/skills/object-create');

const REQUIRED_HEADINGS = [
  'When to use',
  'Product baseline fields',
  'Field semantics',
  'Categories and tags (soft)',
  'Research and source hierarchy',
  'Images',
  'Special constraints',
  'Verification',
  'Related workflows',
] as const;

const PLACEHOLDER_RE = /\b(TODO|TBD|FIXME|PLACEHOLDER)\b/i;

function fail(message: string): never {
  console.error(`check:object-create-playbooks: ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const registryKeys = Object.keys(OBJECT_TYPE_REGISTRY).sort();
  let entries: string[];
  try {
    entries = (await readdir(PLAYBOOK_DIR)).filter((f) => f.endsWith('.md')).sort();
  } catch {
    fail('docs/skills/object-create/ directory missing');
  }

  const playbookKeys = entries.map((f) => f.replace(/\.md$/, '')).sort();

  for (const key of registryKeys) {
    if (!playbookKeys.includes(key)) {
      fail(`missing playbook for registry key: ${key}`);
    }
  }

  for (const key of playbookKeys) {
    if (!registryKeys.includes(key)) {
      fail(`orphan playbook without registry key: ${key}`);
    }
  }

  for (const file of entries) {
    const relPath = `docs/skills/object-create/${file}`;
    const raw = await readFile(path.join(ROOT, relPath), 'utf8');
    const parsed = parseKnowledgeFile(relPath, raw);

    if (parsed.frontmatter.type !== 'skill') {
      fail(`${relPath}: frontmatter type must be skill`);
    }
    if (parsed.frontmatter.status !== 'active') {
      fail(`${relPath}: frontmatter status must be active`);
    }
    if (!parsed.frontmatter.description?.trim()) {
      fail(`${relPath}: missing description`);
    }
    const tags = parsed.frontmatter.tags ?? [];
    if (!tags.includes('object-create-playbook')) {
      fail(`${relPath}: missing tag object-create-playbook`);
    }

    for (const heading of REQUIRED_HEADINGS) {
      if (!parsed.body.includes(`## ${heading}`) && !parsed.body.includes(`## ${heading} /`)) {
        fail(`${relPath}: missing heading "## ${heading}"`);
      }
    }

    if (PLACEHOLDER_RE.test(raw)) {
      fail(`${relPath}: contains TODO/TBD/FIXME/PLACEHOLDER`);
    }
  }

  console.log(`check:object-create-playbooks: OK (${entries.length} playbooks)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
