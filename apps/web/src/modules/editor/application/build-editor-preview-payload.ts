import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import type { FeedStoryView } from '@/modules/feed/application/dto/feed-story.dto';

export type EditorPreviewPayload = {
  story: FeedStoryView;
  bodyHtmlSafe: string;
};
import { sanitizePostBodyHtml } from '@/shared/infrastructure/post-body-html-pipeline';

import type { PostEditorLinkedObject } from '../domain/post-editor-linked-object';
import { lexicalStateToMarkdown } from './lexical-state-to-markdown';
import { linkedObjectsToProjectedViews } from './search-object-to-projected-view';

export type BuildEditorPreviewInput = {
  authorUsername: string;
  title: string;
  bodyLexicalJson: string;
  linkedObjects: readonly PostEditorLinkedObject[];
  searchResultsById: Readonly<Record<string, SearchObjectResult>>;
  resolveImageUrl: (cid: string, src: string) => string;
};

export function buildEditorPreviewPayload(
  input: BuildEditorPreviewInput,
): EditorPreviewPayload {
  const title = input.title.trim();
  const markdown = lexicalStateToMarkdown(input.bodyLexicalJson, {
    resolveImageUrl: input.resolveImageUrl,
  });
  const bodyHtmlSafe = sanitizePostBodyHtml(markdown);
  const now = new Date().toISOString();
  const excerpt =
    markdown.replace(/\s+/g, ' ').trim().slice(0, 280) ||
    title ||
    '';

  return {
    story: {
      id: `preview-${input.authorUsername}`,
      authorName: input.authorUsername,
      permlink: 'preview',
      createdAt: now,
      feedAt: now,
      title: title || undefined,
      excerpt,
      category: null,
      rebloggedByViewer: false,
      children: 0,
      objects: linkedObjectsToProjectedViews(
        input.linkedObjects,
        input.searchResultsById,
      ),
      votes: { totalCount: 0, previewVoters: [], voted: false },
    },
    bodyHtmlSafe,
  };
}
