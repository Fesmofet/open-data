/**
 * Fix broken links after pages-first web spec reorganization.
 * Idempotent — safe to re-run.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'docs/apps/web/spec');

/** Replace only when `from` is not already prefixed (avoids pages/pages/ double rewrite). */
function guardedReplace(text: string, from: string, to: string): string {
  if (from.includes('object/navigation.md') && to.includes('pages/object/navigation.md')) {
    return text.replace(/(?<!pages\/)object\/navigation\.md/g, to);
  }
  return text.split(from).join(to);
}

const REPLACEMENTS: Array<[string, string]> = [
  // Double-prefix fix (must run first)
  ['pages/pages/', 'pages/'],
  // Profile migration (prior)
  ['../../page-spec.md', '../../profile-shell.md'],
  ['../page-spec.md', '../profile-shell.md'],
  ['[page-spec.md](page-spec.md)', '[profile-shell.md](profile-shell.md)'],
  ['routes/feed/page-spec.md', 'routes/feed.md'],
  ['../routes/feed/page-spec.md', '../routes/feed.md'],
  ['routes/social-graph/page-spec.md', 'routes/social-graph.md'],
  ['../routes/social-graph/page-spec.md', '../routes/social-graph.md'],
  ['routes/user-shop/page-spec.md', 'routes/user-shop.md'],
  ['../routes/user-shop/page-spec.md', '../routes/user-shop.md'],
  ['../user-shop/page-spec.md', '../user-shop.md'],
  ['pages/user-profile/routes/map/page-spec.md', 'pages/user-profile/routes/map.md'],
  ['routes/map/page-spec.md', 'routes/map.md'],
  // Object → pages/object (guarded for navigation — see guardedReplace)
  ['object/gallery.md', 'pages/object/routes/gallery.md'],
  ['object/right-rail.md', 'pages/object/routes/right-rail.md'],
  ['object-updates-feed.md', 'pages/object/routes/updates.md'],
  ['object-edit.md', 'pages/object/routes/edit-mode.md'],
  ['object-followers-feed.md', 'pages/object/routes/followers.md'],
  ['object-authority-feed.md', 'pages/object/routes/authority.md'],
  // Simple pages → pages/<area>/page.md
  ['(home.md)', '(pages/home/page.md)'],
  ['(discover.md)', '(pages/discover/page.md)'],
  ['(settings.md)', '(pages/settings/page.md)'],
  ['(editor.md)', '(pages/editor/page.md)'],
  ['(editor-drafts.md)', '(pages/drafts/page.md)'],
  ['(notifications.md)', '(pages/notifications/page.md)'],
  ['(object-create.md)', '(pages/object-create/page.md)'],
  ['(post-article.md)', '(pages/user-profile/routes/post-article.md)'],
  ['docs/apps/web/spec/object/navigation.md', 'docs/apps/web/spec/pages/object/navigation.md'],
  ['docs/apps/web/spec/post-article.md', 'docs/apps/web/spec/pages/user-profile/routes/post-article.md'],
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let text = fs.readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of REPLACEMENTS) {
    next = guardedReplace(next, from, to);
  }
  // Guarded navigation path (not in REPLACEMENTS list to avoid unguarded split)
  next = guardedReplace(
    next,
    'object/navigation.md',
    'pages/object/navigation.md',
  );
  if (next !== text) {
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}

// eslint-disable-next-line no-console
console.log(`fixed links in ${changed} files`);
