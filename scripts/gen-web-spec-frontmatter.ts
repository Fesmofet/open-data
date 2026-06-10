/**
 * Prepends YAML frontmatter to docs/apps/web/spec markdown files when missing.
 * Run: pnpm tsx scripts/gen-web-spec-frontmatter.ts
 * Dry-run: pnpm tsx scripts/gen-web-spec-frontmatter.ts --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';

const SPEC_ROOT = path.join(process.cwd(), 'docs/apps/web/spec');
const DRY_RUN = process.argv.includes('--dry-run');
const UPDATED_AT = '2026-06-10';

const LEGACY_PATH_PATTERNS = [
  /^pages\/user-profile\/page-spec\.md$/,
  /^pages\/user-profile\/routes\/.*\/page-spec\.md$/,
  /^pages\/user-profile\/variants\//,
  /^pages\/user-profile\/query-params-audit\.md$/,
];

function slugFromRel(rel: string): string {
  return rel
    .replace(/\.md$/i, '')
    .split('/')
    .filter(Boolean)
    .join('-')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function titleFromBody(body: string, fallback: string): string {
  const h1 = /^#\s+(.+)$/m.exec(body);
  if (h1?.[1]) {
    return h1[1].replace(/\s*\([^)]*\)\s*$/, '').trim();
  }
  const bold = /^\*\*(.+?)\*\*/m.exec(body);
  if (bold?.[1]) return bold[1].trim();
  return fallback.replace(/-/g, ' ');
}

function hasYamlFrontmatter(raw: string): boolean {
  const normalized = raw.replace(/^\uFEFF/, '');
  if (!normalized.startsWith('---\n')) return false;
  const end = normalized.indexOf('\n---', 4);
  return end > 0;
}

function pageAreaFromPath(p: string): string | null {
  const m = /^pages\/([^/]+)\//.exec(p);
  return m?.[1] ?? null;
}

function inferTags(rel: string): string[] {
  const tags = new Set<string>(['web']);
  const p = rel.replace(/\\/g, '/');

  if (p === 'overview.md') return ['web', 'overview'];
  if (p === 'pages/index.md') return ['web', 'pages', 'index'];

  const area = pageAreaFromPath(p);
  if (area) {
    tags.add('page');
    tags.add(area);
    if (p.endsWith('/page-shell.md') || p.endsWith('/page.md')) {
      return [...tags];
    }
    if (p.includes('/routes/')) {
      return [...tags];
    }
  }

  const tagMap: Array<[RegExp, string[]]> = [
    [/^architecture\.md$/, ['cross-cutting', 'architecture']],
    [/^web-conventions\.md$/, ['cross-cutting', 'conventions']],
    [/^layout-system\.md$/, ['layout']],
    [/^shell-mode\.md$/, ['layout', 'shell-mode']],
    [/^theme\.md$/, ['theme']],
    [/^i18n\.md$/, ['i18n']],
    [/^images\.md$/, ['images']],
    [/^maps\.md$/, ['maps']],
    [/^auth\.md$/, ['auth']],
    [/^notifications\.md$/, ['notifications']],
    [/^app-header\.md$/, ['layout', 'app-header']],
    [/^feed\.md$/, ['feed']],
    [/^object-card\.md$/, ['object-page', 'components']],
    [/^object-create-broadcast\.md$/, ['object-create', 'broadcast']],
    [/^object-follow\.md$/, ['object-page', 'social']],
    [/^user-follow\.md$/, ['user-profile', 'social']],
    [/^seo\.md$/, ['seo', 'cross-cutting']],
    [/^routing-proxy\.md$/, ['routing', 'cross-cutting']],
    [/^search\.md$/, ['search', 'app-header']],
    [/^bff-api\.md$/, ['bff', 'api']],
    [/^object\//, ['object-page', 'stub']],
    [/^components\//, ['components']],
    [/^pages\/user-profile\/profile-shell\.md$/, ['user-profile', 'routing']],
    [/^pages\/user-profile\/data-loading\.md$/, ['user-profile', 'data-loading']],
    [/^pages\/user-profile\/components\//, ['user-profile', 'components']],
  ];

  for (const [re, extra] of tagMap) {
    if (re.test(p)) {
      for (const t of extra) tags.add(t);
      break;
    }
  }

  if (LEGACY_PATH_PATTERNS.some((re) => re.test(p))) {
    tags.add('legacy');
  }

  return [...tags];
}

function hubSpecForArea(area: string): string {
  if (area === 'object') {
    return 'docs/apps/web/spec/pages/object/page-shell.md';
  }
  if (area === 'user-profile') {
    return 'docs/apps/web/spec/pages/user-profile/profile-shell.md';
  }
  return `docs/apps/web/spec/pages/${area}/page.md`;
}

function inferRelated(rel: string): string[] {
  const p = rel.replace(/\\/g, '/');
  const related: string[] = ['docs/apps/web/spec/overview.md'];

  if (p !== 'overview.md') {
    const area = pageAreaFromPath(p);
    if (area) {
      related.push('docs/apps/web/spec/pages/index.md');
      if (p.includes('/routes/') || p.endsWith('/navigation.md') || p.endsWith('/data-loading.md')) {
        related.push(hubSpecForArea(area));
      }
    }
    if (p.startsWith('object/')) {
      related.push('docs/apps/web/spec/pages/object/navigation.md');
    }
    if (p.startsWith('components/')) {
      related.push('docs/apps/web/spec/architecture.md');
    }
  }

  const pairs: Array<[RegExp, string]> = [
    [/^auth\.md$/, 'docs/apps/web/spec/web-conventions.md'],
    [/^bff-api\.md$/, 'docs/apps/web/spec/auth.md'],
    [/^app-header\.md$/, 'docs/apps/web/spec/search.md'],
    [/^search\.md$/, 'docs/apps/web/spec/pages/discover/page.md'],
    [/^object-create-broadcast\.md$/, 'docs/apps/web/spec/pages/object-create/page.md'],
    [/^routing-proxy\.md$/, 'docs/apps/web/spec/layout-system.md'],
    [/^seo\.md$/, 'docs/apps/web/spec/i18n.md'],
    [/^layout-system\.md$/, 'docs/apps/web/spec/shell-mode.md'],
    [/^user-follow\.md$/, 'docs/apps/web/spec/pages/user-profile/routes/social-graph.md'],
    [/^pages\/sign-in\//, 'docs/apps/web/spec/auth.md'],
  ];

  for (const [re, target] of pairs) {
    if (re.test(p) && !related.includes(target)) {
      related.push(target);
    }
  }

  return related;
}

function inferType(rel: string): 'overview' | 'spec' {
  return rel.replace(/\\/g, '/') === 'overview.md' ? 'overview' : 'spec';
}

function inferStatus(rel: string): 'active' | 'deprecated' {
  const p = rel.replace(/\\/g, '/');
  if (LEGACY_PATH_PATTERNS.some((re) => re.test(p))) {
    return 'deprecated';
  }
  return 'active';
}

function formatFrontmatter(meta: {
  id: string;
  title: string;
  type: string;
  status: string;
  scope: string;
  tags: string[];
  related: string[];
}): string {
  const tagsLine = `[${meta.tags.join(', ')}]`;
  const relatedLines = meta.related.map((r) => `  - ${r}`).join('\n');
  return `---
id: ${meta.id}
title: ${meta.title}
type: ${meta.type}
status: ${meta.status}
scope: web
tags: ${tagsLine}
updated_at: ${UPDATED_AT}
related:
${relatedLines}
---

`;
}

function collectMarkdownFiles(dir: string, base = ''): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...collectMarkdownFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.md')) {
      out.push(rel);
    }
  }
  return out.sort();
}

function main(): void {
  const files = collectMarkdownFiles(SPEC_ROOT);
  let updated = 0;
  let skipped = 0;

  for (const rel of files) {
    const abs = path.join(SPEC_ROOT, rel);
    const raw = fs.readFileSync(abs, 'utf8');

    if (hasYamlFrontmatter(raw)) {
      skipped += 1;
      continue;
    }

    const id = `web-${slugFromRel(rel)}`;
    const title = titleFromBody(raw, slugFromRel(rel));
    const fm = formatFrontmatter({
      id,
      title,
      type: inferType(rel),
      status: inferStatus(rel),
      scope: 'web',
      tags: inferTags(rel),
      related: inferRelated(rel),
    });

    const next = fm + raw.replace(/^\uFEFF/, '');
    if (DRY_RUN) {
      // eslint-disable-next-line no-console
      console.log(`would update: ${rel}`);
    } else {
      fs.writeFileSync(abs, next, 'utf8');
    }
    updated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `${DRY_RUN ? 'Dry-run: ' : ''}frontmatter: updated=${updated} skipped=${skipped} total=${files.length}`,
  );
}

main();
