export function buildRoutingText(parts: {
  title: string;
  description: string | null;
  path: string;
  tags: string[];
}): string {
  const pathSlugs = parts.path
    .replace(/\.md$/, '')
    .split(/[/\-_.]/)
    .filter((s) => s.length > 1);

  return [parts.title, parts.description ?? '', parts.path, ...parts.tags, ...pathSlugs]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
}
