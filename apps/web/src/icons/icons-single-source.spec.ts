import fs from 'node:fs';
import path from 'node:path';

const SRC_ROOT = path.join(__dirname, '..');
const ALLOWLIST = [
  'modules/currency/presentation/components/line-chart-svg.tsx',
  'modules/object/presentation/components/star-rating.tsx',
  'modules/map/',
  'icons/',
];

function collectFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, acc);
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function isAllowlisted(relativePath: string): boolean {
  return ALLOWLIST.some((allowed) => relativePath.includes(allowed));
}

describe('icons single-source guards', () => {
  it('has no inline svg in modules/shared outside allowlist (TC-018)', () => {
    const roots = [
      path.join(SRC_ROOT, 'modules'),
      path.join(SRC_ROOT, 'shared'),
    ];
    const violations: string[] = [];

    for (const root of roots) {
      for (const file of collectFiles(root)) {
        const relative = path.relative(SRC_ROOT, file).replace(/\\/g, '/');
        if (isAllowlisted(relative)) {
          continue;
        }
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('<svg')) {
          violations.push(relative);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('does not import lucide-react outside icon packs (TC-019)', () => {
    const violations: string[] = [];

    for (const file of collectFiles(SRC_ROOT)) {
      const relative = path.relative(SRC_ROOT, file).replace(/\\/g, '/');
      if (relative.startsWith('icons/packs/')) {
        continue;
      }
      const content = fs.readFileSync(file, 'utf8');
      if (/from ['"]lucide-react['"]/.test(content)) {
        violations.push(relative);
      }
    }

    expect(violations).toEqual([]);
  });
});
