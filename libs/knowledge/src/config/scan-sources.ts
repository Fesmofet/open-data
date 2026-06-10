import { readdir, readFile } from 'node:fs/promises';
import * as path from 'node:path';
import {
  KNOWLEDGE_IGNORE_SEGMENTS,
  KNOWLEDGE_SOURCE_ROOTS,
  type KnowledgeSourceRoot,
} from './knowledge.sources';

function shouldIgnore(relativePath: string, extraIgnore?: string[]): boolean {
  const parts = relativePath.replace(/\\/g, '/').split('/');
  if (parts.some((p) => KNOWLEDGE_IGNORE_SEGMENTS.includes(p))) {
    return true;
  }
  if (extraIgnore) {
    for (const pattern of extraIgnore) {
      const prefix = pattern.replace(/\*\*$/, '').replace(/\*\*/g, '');
      if (relativePath.includes(prefix)) return true;
    }
  }
  return false;
}

async function walkMdFiles(
  dir: string,
  workspaceRoot: string,
  extraIgnore: string[] | undefined,
  out: string[],
): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(workspaceRoot, abs).replace(/\\/g, '/');
    if (shouldIgnore(rel, extraIgnore)) continue;

    if (entry.isDirectory()) {
      await walkMdFiles(abs, workspaceRoot, extraIgnore, out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(rel);
    }
  }
}

function matchGlobSimple(relativePath: string, glob: string): boolean {
  const norm = relativePath.replace(/\\/g, '/');
  if (glob === '**/*.md') return norm.endsWith('.md');
  if (glob === '**/AGENTS.md') return norm.endsWith('/AGENTS.md') || norm === 'AGENTS.md';
  return norm.includes(glob.replace(/\*\*/g, '').replace(/\*/g, ''));
}

async function collectFromRoot(
  workspaceRoot: string,
  source: KnowledgeSourceRoot,
): Promise<string[]> {
  const out: string[] = [];

  if (source.files) {
    for (const file of source.files) {
      const rel = path.join(source.root, file).replace(/\\/g, '/');
      if (!shouldIgnore(rel, source.ignore)) {
        out.push(rel);
      }
    }
    return out;
  }

  if (source.glob) {
    const startDir = path.join(workspaceRoot, source.root);
    const collected: string[] = [];
    await walkMdFiles(startDir, workspaceRoot, source.ignore, collected);
    return collected.filter((p) => matchGlobSimple(p, source.glob!));
  }

  return out;
}

export async function scanKnowledgeSourcePaths(workspaceRoot: string): Promise<string[]> {
  const all: string[] = [];
  for (const source of KNOWLEDGE_SOURCE_ROOTS) {
    const paths = await collectFromRoot(workspaceRoot, source);
    all.push(...paths);
  }
  return [...new Set(all)].sort();
}

export async function readSourceFile(
  workspaceRoot: string,
  relativePath: string,
): Promise<string> {
  const abs = path.join(workspaceRoot, relativePath);
  return readFile(abs, 'utf8');
}
