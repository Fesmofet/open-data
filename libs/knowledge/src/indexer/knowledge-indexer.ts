import * as path from 'node:path';
import type { Kysely } from 'kysely';
import { chunkMarkdown } from '../chunker/chunk-markdown';
import { readSourceFile, scanKnowledgeSourcePaths } from '../config/scan-sources';
import { parseKnowledgeFile } from '../parser/parse-knowledge-file';
import { buildRegistryDocuments } from '../registry/build-registry-documents';
import { KnowledgeRepository } from '../repository/knowledge.repository';
import type { KnowledgeDatabase } from '../repository/types';
import { splitLessonsFile } from './split-lessons';

export interface ReindexOptions {
  workspaceRoot: string;
  pathFilter?: string;
}

export interface ReindexStats {
  indexed: number;
  skipped: number;
  deleted: number;
  chunks: number;
  durationMs: number;
}

function sourceRootForPath(relativePath: string): string {
  if (relativePath.startsWith('registry/')) return 'registry';
  if (relativePath.startsWith('tasks/')) return 'tasks';
  if (relativePath.startsWith('docs/')) return 'docs';
  return '.';
}

async function indexDocument(
  repo: KnowledgeRepository,
  relativePath: string,
  raw: string,
  stats: { indexed: number; skipped: number; chunks: number },
): Promise<void> {
  const parsed = parseKnowledgeFile(relativePath, raw);
  const unchanged = await repo.findFileByContentHash(parsed.path, parsed.contentHash);
  if (unchanged) {
    stats.skipped += 1;
    return;
  }

  const singleChunk = parsed.frontmatter.type === 'overview';
  const chunks = chunkMarkdown(parsed.body, { singleChunk });

  await repo.upsertFile({
    path: parsed.path,
    title: parsed.frontmatter.title,
    body: raw,
    type: parsed.frontmatter.type ?? 'spec',
    status: parsed.frontmatter.status,
    scope: parsed.frontmatter.scope ?? null,
    owner: parsed.frontmatter.owner ?? null,
    tags: parsed.frontmatter.tags,
    source_root: sourceRootForPath(parsed.path),
    content_hash: parsed.contentHash,
    updated_at: parsed.frontmatter.updated_at ?? null,
    chunks: chunks.map((c) => ({
      heading: c.heading,
      heading_path: c.headingPath,
      chunk_index: c.chunkIndex,
      content: c.content,
      token_count: c.tokenCount,
      section_type: c.sectionType,
      metadata: {
        type: parsed.frontmatter.type,
        scope: parsed.frontmatter.scope,
        tags: parsed.frontmatter.tags,
        section: c.sectionType,
      },
    })),
  });

  stats.indexed += 1;
  stats.chunks += chunks.length;
}

export async function runKnowledgeReindex(
  db: Kysely<KnowledgeDatabase>,
  options: ReindexOptions,
): Promise<ReindexStats> {
  const start = Date.now();
  const repo = new KnowledgeRepository(db);
  const stats = { indexed: 0, skipped: 0, chunks: 0 };
  const seenPaths = new Set<string>();

  const sourcePaths = await scanKnowledgeSourcePaths(options.workspaceRoot);
  const filtered = options.pathFilter
    ? sourcePaths.filter((p) => p === options.pathFilter || p.startsWith(options.pathFilter!))
    : sourcePaths;

  for (const rel of filtered) {
    if (rel === 'tasks/lessons.md') {
      const raw = await readSourceFile(options.workspaceRoot, rel);
      const sections = splitLessonsFile(raw);
      for (const section of sections) {
        seenPaths.add(section.path);
        await indexDocument(repo, section.path, section.content, stats);
      }
      continue;
    }

    seenPaths.add(rel);
    const raw = await readSourceFile(options.workspaceRoot, rel);
    await indexDocument(repo, rel, raw, stats);
  }

  if (!options.pathFilter) {
    for (const doc of buildRegistryDocuments()) {
      seenPaths.add(doc.path);
      await indexDocument(repo, doc.path, doc.content, stats);
    }
  } else if (options.pathFilter.startsWith('registry/')) {
    for (const doc of buildRegistryDocuments()) {
      if (doc.path.startsWith(options.pathFilter)) {
        seenPaths.add(doc.path);
        await indexDocument(repo, doc.path, doc.content, stats);
      }
    }
  }

  let deleted = 0;
  if (!options.pathFilter) {
    const existing = await repo.listPaths();
    for (const p of existing) {
      if (!seenPaths.has(p)) {
        await repo.deleteFileByPath(p);
        deleted += 1;
      }
    }
  }

  return {
    indexed: stats.indexed,
    skipped: stats.skipped,
    deleted,
    chunks: stats.chunks,
    durationMs: Date.now() - start,
  };
}

export function resolveWorkspaceRoot(): string {
  return path.resolve(process.cwd());
}
