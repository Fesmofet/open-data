/**
 * Minimal YAML frontmatter parser for knowledge docs (no external yaml dep).
 */
export function splitFrontmatter(raw: string): { frontmatter: string | null; body: string } {
  const normalized = raw.replace(/^\uFEFF/, '');
  if (!normalized.startsWith('---')) {
    return { frontmatter: null, body: normalized };
  }
  const end = normalized.indexOf('\n---', 3);
  if (end < 0) {
    return { frontmatter: null, body: normalized };
  }
  const fm = normalized.slice(4, end).trim();
  const body = normalized.slice(end + 4).replace(/^\r?\n/, '');
  return { frontmatter: fm, body };
}

function parseInlineArray(value: string): string[] | null {
  const v = value.trim();
  if (!v.startsWith('[') || !v.endsWith(']')) {
    return null;
  }
  const inner = v.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(',').map((item) => String(parseScalar(item.trim())));
}

function parseScalar(value: string): string | string[] | boolean | number {
  const v = value.trim();
  const inlineArray = parseInlineArray(v);
  if (inlineArray) return inlineArray;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

export function parseFrontmatterYaml(yaml: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let currentArrayKey: string | null = null;

  for (const line of yaml.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const listMatch = /^-\s+(.+)$/.exec(trimmed);
    if (listMatch && currentArrayKey) {
      const arr = (out[currentArrayKey] as string[]) ?? [];
      arr.push(String(parseScalar(listMatch[1]!)));
      out[currentArrayKey] = arr;
      continue;
    }

    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(trimmed);
    if (!kv) continue;

    const [, key, rest] = kv;
    if (!key) continue;

    if (rest === '' || rest === undefined) {
      currentArrayKey = key;
      out[key] = [];
      continue;
    }

    currentArrayKey = null;
    out[key] = parseScalar(rest);
  }

  return out;
}
