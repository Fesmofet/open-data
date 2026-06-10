/**
 * One-shot migration: web spec pages-first reorganization.
 * Run: pnpm tsx scripts/migrate-web-spec-pages.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const SPEC = path.join(process.cwd(), 'docs/apps/web/spec');
const UPDATED = '2026-06-10';

function read(rel: string): string {
  return fs.readFileSync(path.join(SPEC, rel), 'utf8');
}

function write(rel: string, content: string): void {
  const abs = path.join(SPEC, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith('---\n')) return raw;
  const end = raw.indexOf('\n---', 4);
  if (end < 0) return raw;
  return raw.slice(end + 4).replace(/^\r?\n/, '');
}

function stub(fromRel: string, toRel: string, title: string): string {
  const fromDir = path.dirname(fromRel);
  const relLink = path.relative(fromDir, toRel).replace(/\\/g, '/');
  const canonical = `docs/apps/web/spec/${toRel}`;
  const id = toRel.replace(/\.md$/i, '').replace(/\//g, '-');
  return `---
id: web-stub-${id}
title: ${title} (moved)
type: spec
status: deprecated
scope: web
tags: [web, stub]
updated_at: ${UPDATED}
related:
  - ${canonical}
---

# Moved

Canonical spec: [${title}](${relLink}).
`;
}

function fm(block: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [k, v] of Object.entries(block)) {
    if (Array.isArray(v)) {
      if (k === 'tags') {
        lines.push(`${k}: [${v.join(', ')}]`);
      } else {
        lines.push(`${k}:`);
        for (const item of v) lines.push(`  - ${item}`);
      }
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

/** Moves: [fromRel, toRel, frontmatterOverrides] */
const MOVES: Array<[string, string, Record<string, unknown>]> = [
  [
    'object/navigation.md',
    'pages/object/navigation.md',
    {
      id: 'web-pages-object-navigation',
      title: 'Object page — navigation & transitions',
      tags: ['web', 'page', 'object-page', 'navigation'],
      related: [
        'docs/apps/web/spec/overview.md',
        'docs/apps/web/spec/pages/index.md',
        'docs/apps/web/spec/pages/object/page-shell.md',
        'docs/apps/web/spec/routing-proxy.md',
      ],
    },
  ],
  [
    'object/gallery.md',
    'pages/object/routes/gallery.md',
    {
      id: 'web-pages-object-routes-gallery',
      title: 'Object page — Gallery tab',
      tags: ['web', 'page', 'object-page', 'gallery'],
      related: [
        'docs/apps/web/spec/pages/object/page-shell.md',
        'docs/apps/web/spec/pages/object/navigation.md',
      ],
    },
  ],
  [
    'object/right-rail.md',
    'pages/object/routes/right-rail.md',
    {
      id: 'web-pages-object-routes-right-rail',
      title: 'Object page — right rail',
      tags: ['web', 'page', 'object-page', 'layout'],
      related: [
        'docs/apps/web/spec/pages/object/page-shell.md',
        'docs/apps/web/spec/pages/object/routes/ref-feeds.md',
      ],
    },
  ],
  [
    'object-updates-feed.md',
    'pages/object/routes/updates.md',
    {
      id: 'web-pages-object-routes-updates',
      title: 'Object page — updates feed',
      tags: ['web', 'page', 'object-page', 'updates'],
      related: ['docs/apps/web/spec/pages/object/page-shell.md'],
    },
  ],
  [
    'object-followers-feed.md',
    'pages/object/routes/followers.md',
    {
      id: 'web-pages-object-routes-followers',
      title: 'Object page — followers',
      tags: ['web', 'page', 'object-page', 'social'],
      related: ['docs/apps/web/spec/pages/object/page-shell.md'],
    },
  ],
  [
    'object-authority-feed.md',
    'pages/object/routes/authority.md',
    {
      id: 'web-pages-object-routes-authority',
      title: 'Object page — authority',
      tags: ['web', 'page', 'object-page', 'authority'],
      related: ['docs/apps/web/spec/pages/object/page-shell.md'],
    },
  ],
  [
    'object-edit.md',
    'pages/object/routes/edit-mode.md',
    {
      id: 'web-pages-object-routes-edit-mode',
      title: 'Object page — edit mode',
      tags: ['web', 'page', 'object-page', 'edit'],
      related: ['docs/apps/web/spec/pages/object/page-shell.md'],
    },
  ],
  ['home.md', 'pages/home/page.md', { id: 'web-pages-home', title: 'Home page', tags: ['web', 'page', 'home'], related: ['docs/apps/web/spec/pages/index.md'] }],
  ['discover.md', 'pages/discover/page.md', { id: 'web-pages-discover', title: 'Discover page', tags: ['web', 'page', 'discover'], related: ['docs/apps/web/spec/pages/index.md'] }],
  ['settings.md', 'pages/settings/page.md', { id: 'web-pages-settings', title: 'Settings page', tags: ['web', 'page', 'settings'], related: ['docs/apps/web/spec/pages/index.md'] }],
  ['editor.md', 'pages/editor/page.md', { id: 'web-pages-editor', title: 'Post editor', tags: ['web', 'page', 'editor'], related: ['docs/apps/web/spec/pages/index.md', 'docs/apps/web/spec/pages/drafts/page.md'] }],
  ['editor-drafts.md', 'pages/drafts/page.md', { id: 'web-pages-drafts', title: 'Editor drafts', tags: ['web', 'page', 'editor', 'drafts'], related: ['docs/apps/web/spec/pages/editor/page.md'] }],
  ['notifications.md', 'pages/notifications/page.md', { id: 'web-pages-notifications', title: 'Notifications UI', tags: ['web', 'page', 'notifications'], related: ['docs/apps/web/spec/pages/index.md'] }],
  ['object-create.md', 'pages/object-create/page.md', { id: 'web-pages-object-create', title: 'Object create page', tags: ['web', 'page', 'object-create'], related: ['docs/apps/web/spec/object-create-broadcast.md'] }],
  ['post-article.md', 'pages/user-profile/routes/post-article.md', { id: 'web-pages-user-profile-routes-post-article', title: 'Post article', tags: ['web', 'page', 'user-profile', 'post'], related: ['docs/apps/web/spec/pages/user-profile/profile-shell.md'] }],
];

function linkRewrites(body: string, fromPrefix: string, toPrefix: string): string {
  let b = body;
  b = b.replaceAll('../overview.md', '../../overview.md');
  b = b.replaceAll('[web overview](../overview.md)', '[web overview](../../overview.md)');
  b = b.replaceAll('[web spec overview](./overview.md)', '[web overview](../../overview.md)');
  b = b.replaceAll('[web overview](overview.md)', '[web overview](../../overview.md)');
  b = b.replaceAll('[navigation.md](navigation.md)', '[navigation.md](../navigation.md)');
  b = b.replaceAll('[right-rail.md](right-rail.md)', '[right-rail.md](routes/right-rail.md)');
  b = b.replaceAll('[gallery.md](gallery.md)', '[gallery.md](routes/gallery.md)');
  b = b.replaceAll('[object-updates-feed.md](../object-updates-feed.md)', '[updates.md](routes/updates.md)');
  b = b.replaceAll('[object-followers-feed.md](../object-followers-feed.md)', '[followers.md](routes/followers.md)');
  b = b.replaceAll('[object-authority-feed.md](../object-authority-feed.md)', '[authority.md](routes/authority.md)');
  b = b.replaceAll('[object-edit.md](object-edit.md)', '[edit-mode.md](routes/edit-mode.md)');
  b = b.replaceAll('[object-updates-feed.md](object-updates-feed.md)', '[updates.md](routes/updates.md)');
  b = b.replaceAll('[object-card.md](../object-card.md)', '[object-card.md](../../object-card.md)');
  b = b.replaceAll('[object-card.md](object-card.md)', '[object-card.md](../../object-card.md)');
  b = b.replaceAll('[auth.md](auth.md)', '[auth.md](../../auth.md)');
  b = b.replaceAll('[seo.md](seo.md)', '[seo.md](../../seo.md)');
  b = b.replaceAll('[routing-proxy.md](routing-proxy.md)', '[routing-proxy.md](../../routing-proxy.md)');
  b = b.replaceAll('[object-create-broadcast.md](object-create-broadcast.md)', '[object-create-broadcast.md](../../object-create-broadcast.md)');
  b = b.replaceAll('[editor-drafts.md](editor-drafts.md)', '[drafts/page.md](../drafts/page.md)');
  b = b.replaceAll('[editor.md](editor.md)', '[editor/page.md](../editor/page.md)');
  b = b.replaceAll('[discover.md](discover.md)', '[discover/page.md](../discover/page.md)');
  b = b.replaceAll('[app-header.md](app-header.md)', '[app-header.md](../../app-header.md)');
  b = b.replaceAll('[layout-system.md](layout-system.md)', '[layout-system.md](../../layout-system.md)');
  b = b.replaceAll('[theme.md](theme.md)', '[theme.md](../../theme.md)');
  b = b.replaceAll('[i18n.md](i18n.md)', '[i18n.md](../../i18n.md)');
  b = b.replaceAll('[shell-mode.md](shell-mode.md)', '[shell-mode.md](../../shell-mode.md)');
  b = b.replaceAll('[architecture.md](architecture.md)', '[architecture.md](../../architecture.md)');
  b = b.replaceAll('[feed.md](feed.md)', '[feed.md](../../feed.md)');
  b = b.replaceAll('[images.md](images.md)', '[images.md](../../images.md)');
  b = b.replaceAll('[object-follow.md](object-follow.md)', '[object-follow.md](../../object-follow.md)');
  return b;
}

function main(): void {
  for (const [from, to, meta] of MOVES) {
    const fromPath = path.join(SPEC, from);
    if (!fs.existsSync(fromPath)) {
      // eslint-disable-next-line no-console
      console.warn(`skip missing: ${from}`);
      continue;
    }
    let body = stripFrontmatter(read(from));
    body = linkRewrites(body, from, to);
    const front = fm({
      ...meta,
      type: 'spec',
      status: 'active',
      scope: 'web',
      updated_at: UPDATED,
    });
    const title = String(meta.title ?? to);
    write(to, front + body);
    write(from, stub(from, to, title));
    // eslint-disable-next-line no-console
    console.log(`moved ${from} -> ${to}`);
  }
}

main();
