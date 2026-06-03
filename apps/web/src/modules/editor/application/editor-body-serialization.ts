import { $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from 'lexical';

import { $isImageNode, POST_IMAGE_NODE_TYPE } from '../domain/nodes/image-node';

function $forEachDescendant(node: LexicalNode, visit: (n: LexicalNode) => void): void {
  visit(node);
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      $forEachDescendant(child, visit);
    }
  }
}

type SerializedEditorState = {
  root?: unknown;
};

/** True when `body` looks like Lexical `editorState.toJSON()` output. */
/** Rewrites legacy custom node type `image` to `post-image` before parse. */
export function migrateLegacyImageNodeTypes(body: string): string {
  if (!isLexicalDraftJson(body)) {
    return body;
  }
  try {
    const state = JSON.parse(body) as {
      root?: { children?: unknown[] };
    };
    const walk = (nodes: unknown[] | undefined) => {
      if (!nodes) {
        return;
      }
      for (const entry of nodes) {
        if (!entry || typeof entry !== 'object') {
          continue;
        }
        const n = entry as Record<string, unknown>;
        if (n.type === 'image' && typeof n.src === 'string') {
          n.type = POST_IMAGE_NODE_TYPE;
        }
        if (Array.isArray(n.children)) {
          walk(n.children);
        }
      }
    };
    walk(state.root?.children);
    return JSON.stringify(state);
  } catch {
    return body;
  }
}

export function isLexicalDraftJson(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed.startsWith('{')) {
    return false;
  }
  try {
    const parsed = JSON.parse(trimmed) as SerializedEditorState;
    return Boolean(parsed && typeof parsed === 'object' && 'root' in parsed);
  } catch {
    return false;
  }
}

export function serializeEditorState(editor: LexicalEditor): string {
  return JSON.stringify(editor.getEditorState().toJSON());
}

/** Re-resolve image `src` from stored `cid` after loading a draft. */
export function normalizeImageNodeSrcFromCid(
  editor: LexicalEditor,
  contentBaseUrl: string,
  imageContentUrlForCid: (base: string, cid: string) => string,
): void {
  if (!contentBaseUrl) {
    return;
  }
  editor.update(() => {
    const root = $getRoot();
    for (const child of root.getChildren()) {
      $forEachDescendant(child, (node) => {
        if ($isImageNode(node)) {
          const cid = node.getCid().trim();
          if (cid) {
            node.setSrc(imageContentUrlForCid(contentBaseUrl, cid));
          }
        }
      });
    }
  });
}

export function collectImageCidsFromEditorState(json: string): string[] {
  try {
    const state = JSON.parse(json) as {
      root?: { children?: unknown[] };
    };
    const cids: string[] = [];
    const walk = (nodes: unknown[] | undefined) => {
      if (!nodes) {
        return;
      }
      for (const entry of nodes) {
        if (!entry || typeof entry !== 'object') {
          continue;
        }
        const n = entry as Record<string, unknown>;
        const nodeType = n.type;
        const isPostImage =
          nodeType === POST_IMAGE_NODE_TYPE ||
          nodeType === 'image';
        if (isPostImage && typeof n.cid === 'string' && n.cid) {
          cids.push(n.cid);
        }
        if (Array.isArray(n.children)) {
          walk(n.children);
        }
      }
    };
    walk(state.root?.children as unknown[] | undefined);
    return cids;
  } catch {
    return [];
  }
}
