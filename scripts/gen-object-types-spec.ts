import fs from 'fs';
import path from 'path';

import { OBJECT_TYPE_REGISTRY } from '../libs/core/src/object-type-registry';
import { serializeObjectType } from '../libs/knowledge/src/registry/object-type-serializer';

const ROOT = path.resolve(__dirname, '..');
const SPEC_DIR = path.join(ROOT, 'generated/object-types');

function main() {
  if (!fs.existsSync(SPEC_DIR)) {
    fs.mkdirSync(SPEC_DIR, { recursive: true });
  }

  const entries: { objectType: string; file: string }[] = [];

  for (const [objectType, def] of Object.entries(OBJECT_TYPE_REGISTRY)) {
    const mdPath = path.join(SPEC_DIR, `${objectType}.md`);
    const mdContent = serializeObjectType(objectType, def);
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    entries.push({ objectType, file: `${objectType}.md` });
  }

  const readme = `# Object types

Specification for each ODL object type (supported/supposed updates, create payload example).

| Object type | Spec |
|-------------|------|
${entries
  .sort((a, b) => a.objectType.localeCompare(b.objectType))
  .map((e) => `| \`${e.objectType}\` | [${e.objectType}.md](${e.file}) |`)
  .join('\n')}
`;

  fs.writeFileSync(path.join(SPEC_DIR, 'README.md'), readme, 'utf8');
  // eslint-disable-next-line no-console
  console.log(
    'Generated',
    entries.length,
    'object-type spec files + README.md in generated/object-types/',
  );
}

main();
