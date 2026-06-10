import fs from 'fs';
import path from 'path';

import { UPDATE_REGISTRY } from '../libs/core/src/update-registry';
import { serializeUpdateType } from '../libs/knowledge/src/registry/update-type-serializer';

const ROOT = path.resolve(__dirname, '..');
const SPEC_DIR = path.join(ROOT, 'generated/object-updates');

function main() {
  if (!fs.existsSync(SPEC_DIR)) {
    fs.mkdirSync(SPEC_DIR, { recursive: true });
  }

  const entries: { updateType: string; file: string }[] = [];

  for (const [updateType, def] of Object.entries(UPDATE_REGISTRY)) {
    const mdPath = path.join(SPEC_DIR, `${updateType}.md`);
    const mdContent = serializeUpdateType(updateType, def);
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    entries.push({ updateType, file: `${updateType}.md` });
  }

  const readme = `# Object updates

Specification for each ODL update type (cardinality, payload kind, JSON Schema, example).

| Update type | Spec |
|-------------|------|
${entries
  .sort((a, b) => a.updateType.localeCompare(b.updateType))
  .map((e) => `| \`${e.updateType}\` | [${e.updateType}.md](${e.file}) |`)
  .join('\n')}
`;

  fs.writeFileSync(path.join(SPEC_DIR, 'README.md'), readme, 'utf8');
  // eslint-disable-next-line no-console
  console.log(
    'Generated',
    entries.length,
    'update-type spec files + README.md in generated/object-updates/',
  );
}

main();
