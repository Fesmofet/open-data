import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  type LexicalEditor,
} from 'lexical';

import {
  $createImageNode,
  INSERT_IMAGE_COMMAND,
  type ImagePayload,
} from '../domain/editor-lexical-nodes';

export function insertImageAtSelection(
  editor: LexicalEditor,
  payload: ImagePayload,
): void {
  editor.update(() => {
    const imageNode = $createImageNode(payload);
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $insertNodes([imageNode]);
    } else {
      $getRoot().append(imageNode);
    }

    if (!imageNode.getNextSibling()) {
      const paragraph = $createParagraphNode();
      imageNode.insertAfter(paragraph);
      paragraph.selectStart();
    }
  });
}

export function registerInsertImageCommand(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    INSERT_IMAGE_COMMAND,
    (payload) => {
      insertImageAtSelection(editor, payload);
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}
