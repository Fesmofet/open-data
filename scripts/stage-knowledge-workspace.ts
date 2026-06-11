import { copyFile, mkdir } from 'node:fs/promises';
import * as path from 'node:path';
import { scanKnowledgeSourcePaths } from '../libs/knowledge/src/config/scan-sources';

const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, 'dist', 'knowledge-workspace');

async function main(): Promise<void> {
  const sourcePaths = await scanKnowledgeSourcePaths(ROOT);
  let copied = 0;

  for (const rel of sourcePaths) {
    const src = path.join(ROOT, rel);
    const dest = path.join(OUT_DIR, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(src, dest);
    copied += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `stage-knowledge-workspace: copied ${copied} files to ${path.relative(ROOT, OUT_DIR)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
