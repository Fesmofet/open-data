import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $setBlocksType, $wrapNodes } from '@lexical/selection';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
} from 'lexical';

import type { FormatActionId } from '../domain/format-actions';
import {
  $createSpoilerNode,
  $hasSpoilerAncestor,
  $isSpoilerNode,
  $unwrapSpoilersInSelection,
  TOGGLE_SPOILER_COMMAND,
} from '../domain/nodes/spoiler-node';

export type SelectedBlockType = 'paragraph' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export function getSelectedBlockType(): SelectedBlockType {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return 'paragraph';
  }
  const anchor = selection.anchor.getNode();
  const topLevel = anchor.getTopLevelElementOrThrow();
  if ($isHeadingNode(topLevel)) {
    return topLevel.getTag();
  }
  if ($isQuoteNode(topLevel)) {
    return 'quote';
  }
  return 'paragraph';
}

export function selectionHasSpoiler(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  return selection.getNodes().some((node) => $hasSpoilerAncestor(node) || $isSpoilerNode(node));
}

function toggleSpoiler(): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) {
    return;
  }
  const nodes = selection.getNodes();
  if (selectionHasSpoiler()) {
    $unwrapSpoilersInSelection(nodes);
    return;
  }
  $wrapNodes(selection, () => $createSpoilerNode());
}

function applyBlockHeading(tag: 'h1' | 'h2' | 'h3'): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return;
  }
  const blockType = getSelectedBlockType();
  if (blockType === tag) {
    $setBlocksType(selection, () => $createParagraphNode());
    return;
  }
  $setBlocksType(selection, () => $createHeadingNode(tag));
}

export function applyFormatAction(
  editor: LexicalEditor,
  actionId: FormatActionId,
  options?: { linkUrl?: string },
): void {
  if (actionId === 'mention') {
    // Stub: mention picker / insert will be wired in a follow-up.
    return;
  }

  if (actionId === 'link') {
    const url = options?.linkUrl?.trim();
    if (!url) {
      return;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    return;
  }

  if (actionId === 'bold' || actionId === 'italic') {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, actionId);
    return;
  }

  if (actionId === 'code') {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
    return;
  }

  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      return;
    }

    switch (actionId) {
      case 'h1':
        applyBlockHeading('h1');
        break;
      case 'h2':
        applyBlockHeading('h2');
        break;
      case 'h3':
        applyBlockHeading('h3');
        break;
      case 'quote': {
        const blockType = getSelectedBlockType();
        if (blockType === 'quote') {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createQuoteNode());
        }
        break;
      }
      case 'spoiler':
        toggleSpoiler();
        break;
      default:
        break;
    }
  });
}

export function registerSpoilerCommand(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    TOGGLE_SPOILER_COMMAND,
    () => {
      editor.update(() => {
        toggleSpoiler();
      });
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}
