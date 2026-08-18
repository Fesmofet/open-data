/**
 * One-time scaffold for docs/skills/object-create/{objectType}.md playbooks.
 * Does not overwrite existing files. Not run in CI.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import * as path from 'node:path';
import { OBJECT_TYPE_REGISTRY } from '../libs/core/src/object-type-registry/object-type-registry';
import { UPDATE_TYPES } from '../libs/core/src/update-registry/update-types';

const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, 'docs/skills/object-create');

const CATEGORY_UPDATES = new Set([
  UPDATE_TYPES.CATEGORY,
  UPDATE_TYPES.TAG_CATEGORY,
  UPDATE_TYPES.TAG_CATEGORY_ITEM,
]);

function titleCase(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function hasCategorySupport(supported: readonly string[]): boolean {
  return supported.some((u) => CATEGORY_UPDATES.has(u));
}

function formatSupposed(def: (typeof OBJECT_TYPE_REGISTRY)[string]): string {
  if (def.supposed_updates.length === 0) {
    return 'No `supposed_updates` in registry — omit tags or discover existing platform vocabulary.';
  }
  return def.supposed_updates
    .map((s) => {
      const vals = Array.isArray(s.values)
        ? s.values.map((v) => JSON.stringify(v)).join(', ')
        : String(s.values);
      return `- \`${s.update_type}\`: ${vals}`;
    })
    .join('\n');
}

function buildPlaybook(objectType: string): string {
  const def = OBJECT_TYPE_REGISTRY[objectType];
  const title = titleCase(objectType);
  const categoriesSection = hasCategorySupport(def.supported_updates)
    ? `## Categories and tags (soft)

Registry \`supposed_updates\`:

${formatSupposed(def)}

See [object content standards](../object-content-standards.md) for shop \`category\` vs discover tags.`
    : `## Categories and tags (soft)

This type does not support shop \`category\` or discover tag updates — omit.`;

  return `---
title: Create ${objectType} object
description: Agent playbook for ODL ${objectType} object_create and updates.
type: skill
status: active
scope: platform
tags: [object-create, object-create-playbook, ${objectType}, agent]
related:
  - docs/skills/object-content-standards.md
  - docs/skills/object-content-routing.md
---

# Create ${objectType} object

${def.description ?? 'ODL object type.'}

## When to use / not

- **Use** when creating a new \`${objectType}\` on chain via \`odl_build_object_create\`.
- **Use** \`odl_build_update_create\` when the object already exists.
- **Not** for read-only queries — use query-api MCP.

## Product baseline fields

Call \`get_object_create_playbook({ object_type: "${objectType}" })\` for \`required_updates\` (product policy). Common baseline: \`name\`, \`description\`, \`image\` when supported — not a chain requirement.

## Field semantics

Supported updates (registry): ${def.supported_updates.slice(0, 8).join(', ')}${def.supported_updates.length > 8 ? ', …' : ''}.

Use \`get_update_schema({ update_type })\` for \`value_kind\`, \`cardinality\`, and \`localizable\`.

${categoriesSection}

## Research and source hierarchy

- Prefer official or authoritative sources for factual fields.
- Omit unknown facts; do not invent prices, hours, or claims.
- Mark generated marketing copy as generated.

## Images

Follow [object content standards](../object-content-standards.md): stable source or generated → IPFS before broadcast. Create \`imageGallery\` before \`imageGalleryItem\` in initial create when using a gallery.

## Special constraints

- Dedupe before create (search / \`resolve_object\`).
- Web-compatible \`object_id\` when product URLs matter.
- No duplicate object/user refs in one payload.

## Verification

After broadcast, \`resolve_object\` and confirm:

- \`object_type\` = \`${objectType}\`
- \`fields.name\`, \`fields.description\`, \`fields.image\` when in product baseline
- Type-specific fields you set

## Related workflows

- [Object content standards](../object-content-standards.md)
- [Object content routing](../object-content-routing.md)
- [Hive blockchain broadcast](../hive-blockchain-broadcast.md)
`;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  let created = 0;
  let skipped = 0;
  for (const objectType of Object.keys(OBJECT_TYPE_REGISTRY).sort()) {
    const outPath = path.join(OUT_DIR, `${objectType}.md`);
    if (await fileExists(outPath)) {
      skipped += 1;
      continue;
    }
    await writeFile(outPath, buildPlaybook(objectType), 'utf8');
    created += 1;
  }
  console.log(`scaffold-object-create-playbooks: created=${created} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
