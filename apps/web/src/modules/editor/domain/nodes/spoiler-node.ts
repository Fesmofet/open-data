import {
  $applyNodeReplacement,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type SerializedElementNode,
  Spread,
  createCommand,
} from 'lexical';

export const TOGGLE_SPOILER_COMMAND = createCommand<void>('TOGGLE_SPOILER_COMMAND');

export type SerializedSpoilerNode = Spread<
  {
    type: 'spoiler';
    version: 1;
  },
  SerializedElementNode
>;

export class SpoilerNode extends ElementNode {
  static getType(): string {
    return 'spoiler';
  }

  static clone(node: SpoilerNode): SpoilerNode {
    return new SpoilerNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    const className = config.theme.text?.spoiler;
    if (className) {
      dom.className = className;
    }
    dom.setAttribute('data-spoiler', 'true');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedSpoilerNode): SpoilerNode {
    return $createSpoilerNode().updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedSpoilerNode {
    return {
      ...super.exportJSON(),
      type: 'spoiler',
      version: 1,
    };
  }

  isInline(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return true;
  }

  canInsertTextAfter(): boolean {
    return true;
  }
}

export function $createSpoilerNode(): SpoilerNode {
  return $applyNodeReplacement(new SpoilerNode());
}

export function $isSpoilerNode(
  node: LexicalNode | null | undefined,
): node is SpoilerNode {
  return node instanceof SpoilerNode;
}

/** Returns true if any ancestor of `node` is a spoiler. */
export function $hasSpoilerAncestor(node: LexicalNode): boolean {
  let current: LexicalNode | null = node;
  while (current !== null) {
    if ($isSpoilerNode(current)) {
      return true;
    }
    current = current.getParent();
  }
  return false;
}

/** Unwraps spoiler nodes that intersect the selection. */
export function $unwrapSpoilersInSelection(nodes: LexicalNode[]): void {
  const spoilers = new Set<SpoilerNode>();
  for (const node of nodes) {
    let current: LexicalNode | null = node;
    while (current !== null) {
      if ($isSpoilerNode(current)) {
        spoilers.add(current);
        break;
      }
      current = current.getParent();
    }
  }
  for (const spoiler of spoilers) {
    const children = spoiler.getChildren();
    for (const child of children) {
      spoiler.insertBefore(child);
    }
    spoiler.remove();
  }
}
