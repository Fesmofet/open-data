import { $createLinkNode } from '@lexical/link';
import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import { objectPagePath } from '@/shared/routes/object-page-path';
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  type LexicalEditor,
} from 'lexical';

export function buildObjectLinkHref(objectId: string): string {
  const path = objectPagePath(objectId);
  if (typeof window === 'undefined') {
    return path;
  }
  return `${window.location.origin}${path}`;
}

export function objectLinkDisplayLabel(result: SearchObjectResult): string {
  return result.name?.trim() || result.object_id;
}

/** Inserts a styled object link at the current selection (visible name, href on current host). */
export function insertObjectLinkAtSelection(
  editor: LexicalEditor,
  result: SearchObjectResult,
): void {
  const href = buildObjectLinkHref(result.object_id);
  const label = objectLinkDisplayLabel(result);

  editor.update(() => {
    const linkNode = $createLinkNode(href);
    linkNode.append($createTextNode(label));

    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selection.insertNodes([linkNode]);
      return;
    }
    $insertNodes([linkNode]);
  });
}
