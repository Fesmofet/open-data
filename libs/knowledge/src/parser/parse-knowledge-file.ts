import { computeContentHash } from './content-hash';
import { inferMetadataFromPath, slugFromPath } from './infer-metadata-from-path';
import {
  knowledgeFrontmatterSchema,
  type KnowledgeFrontmatter,
} from './knowledge-frontmatter.schema';
import { parseFrontmatterYaml, splitFrontmatter } from './parse-frontmatter';

export interface ParsedKnowledgeFile {
  path: string;
  frontmatter: KnowledgeFrontmatter & { id: string; title: string; type: KnowledgeFrontmatter['type'] };
  body: string;
  contentHash: string;
}

function titleFromBody(body: string, fallback: string): string {
  const match = /^#\s+(.+)$/m.exec(body);
  return match?.[1]?.trim() ?? fallback;
}

export function parseKnowledgeFile(relativePath: string, raw: string): ParsedKnowledgeFile {
  const { frontmatter: fmRaw, body } = splitFrontmatter(raw);
  const inferred = inferMetadataFromPath(relativePath);
  const parsedFm = fmRaw ? parseFrontmatterYaml(fmRaw) : {};

  const merged = knowledgeFrontmatterSchema.parse({
    ...inferred,
    ...parsedFm,
  });

  const id = merged.id ?? slugFromPath(relativePath);
  const title =
    merged.title ??
    titleFromBody(body, id.replace(/-/g, ' '));

  const type = merged.type ?? inferred.type ?? 'spec';

  const frontmatter = {
    ...merged,
    id,
    title,
    type,
  };

  const contentHash = computeContentHash(raw);

  return {
    path: relativePath.replace(/\\/g, '/'),
    frontmatter,
    body,
    contentHash,
  };
}
