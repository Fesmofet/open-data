import {
  $createNodeSelection,
  $isElementNode,
  $isNodeSelection,
  $isTextNode,
  $setSelection,
  type BaseSelection,
  type ElementNode,
  type RangeSelection,
} from 'lexical';

import { $isImageNode, type ImageNode } from '../domain/nodes/image-node';

export function $selectImageNode(image: ImageNode): void {
  const nodeSelection = $createNodeSelection();
  nodeSelection.add(image.getKey());
  $setSelection(nodeSelection);
}

export function $getSelectedImageNodes(selection: BaseSelection | null): ImageNode[] {
  if (!$isNodeSelection(selection)) {
    return [];
  }
  return selection.getNodes().filter($isImageNode);
}

/** Image immediately before a collapsed range caret (Backspace should select it). */
export function $getImageBeforeRange(selection: RangeSelection): ImageNode | null {
  if (!selection.isCollapsed()) {
    return null;
  }

  const anchorNode = selection.anchor.getNode();
  if ($isImageNode(anchorNode)) {
    return anchorNode;
  }

  if ($isTextNode(anchorNode)) {
    if (selection.anchor.offset > 0) {
      return null;
    }
    const parent = anchorNode.getParent();
    if (parent) {
      const prev = parent.getPreviousSibling();
      if ($isImageNode(prev)) {
        return prev;
      }
    }
  }

  const topLevel = anchorNode.getTopLevelElement();
  if (!topLevel || $isImageNode(topLevel)) {
    return null;
  }

  if (!$isCaretAtTopLevelStart(selection, topLevel)) {
    return null;
  }

  const prev = topLevel.getPreviousSibling();
  return $isImageNode(prev) ? prev : null;
}

/** Image immediately after a collapsed range caret (Delete should select it). */
export function $getImageAfterRange(selection: RangeSelection): ImageNode | null {
  if (!selection.isCollapsed()) {
    return null;
  }

  const anchorNode = selection.anchor.getNode();
  if ($isImageNode(anchorNode)) {
    return anchorNode;
  }

  if ($isTextNode(anchorNode)) {
    if (selection.anchor.offset < anchorNode.getTextContentSize()) {
      return null;
    }
    const parent = anchorNode.getParent();
    if (parent) {
      const next = parent.getNextSibling();
      if ($isImageNode(next)) {
        return next;
      }
    }
  }

  const topLevel = anchorNode.getTopLevelElement();
  if (!topLevel || $isImageNode(topLevel)) {
    return null;
  }

  if (!$isCaretAtTopLevelEnd(selection, topLevel)) {
    return null;
  }

  const next = topLevel.getNextSibling();
  return $isImageNode(next) ? next : null;
}

function $isCaretAtTopLevelStart(
  selection: RangeSelection,
  topLevel: ElementNode,
): boolean {
  const anchor = selection.anchor;
  const anchorNode = anchor.getNode();

  if (anchorNode === topLevel && anchor.type === 'element' && anchor.offset === 0) {
    return true;
  }

  if ($isTextNode(anchorNode) && anchor.offset === 0) {
    const parent = anchorNode.getParent();
    return parent === topLevel && anchorNode.getIndexWithinParent() === 0;
  }

  if ($isElementNode(anchorNode) && anchor.offset === 0) {
    return anchorNode.getTopLevelElement() === topLevel;
  }

  return false;
}

function $isCaretAtTopLevelEnd(
  selection: RangeSelection,
  topLevel: ElementNode,
): boolean {
  const anchor = selection.anchor;
  const anchorNode = anchor.getNode();

  if (anchorNode === topLevel && anchor.type === 'element') {
    return anchor.offset === topLevel.getChildrenSize();
  }

  if ($isTextNode(anchorNode)) {
    return (
      anchor.offset === anchorNode.getTextContentSize() &&
      anchorNode.getParent() === topLevel &&
      anchorNode.getIndexWithinParent() === topLevel.getChildrenSize() - 1
    );
  }

  return false;
}
