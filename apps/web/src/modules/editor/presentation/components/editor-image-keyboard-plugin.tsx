'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

import {
  $getImageAfterRange,
  $getImageBeforeRange,
  $getSelectedImageNodes,
  $selectImageNode,
} from '../../application/image-selection';
import { $isImageNode } from '../../domain/nodes/image-node';

function setImageDomSelected(el: Element, selected: boolean): void {
  if (selected) {
    el.setAttribute('data-image-selected', '');
    el.setAttribute('aria-selected', 'true');
  } else {
    el.removeAttribute('data-image-selected');
    el.removeAttribute('aria-selected');
  }
}

function syncImageDomSelection(editor: ReturnType<typeof useLexicalComposerContext>[0]) {
  const root = editor.getRootElement();
  if (!root) {
    return;
  }

  for (const el of root.querySelectorAll('[data-post-image]')) {
    setImageDomSelected(el, false);
  }

  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
      return;
    }
    for (const node of $getSelectedImageNodes(selection)) {
      const dom = editor.getElementByKey(node.getKey());
      if (dom) {
        setImageDomSelected(dom, true);
      }
    }
  });
}

export function EditorImageKeyboardPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        let handled = false;
        editor.update(() => {
          const selection = $getSelection();
          if (!selection) {
            return;
          }

          if ($isNodeSelection(selection)) {
            const images = $getSelectedImageNodes(selection);
            if (images.length > 0) {
              selection.deleteNodes();
              handled = true;
            }
            return;
          }

          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const image = $getImageBeforeRange(selection);
            if (image) {
              $selectImageNode(image);
              handled = true;
            }
          }
        });
        if (handled) {
          syncImageDomSelection(editor);
        }
        return handled;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const removeDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      () => {
        let handled = false;
        editor.update(() => {
          const selection = $getSelection();
          if (!selection) {
            return;
          }

          if ($isNodeSelection(selection)) {
            const images = $getSelectedImageNodes(selection);
            if (images.length > 0) {
              selection.deleteNodes();
              handled = true;
            }
            return;
          }

          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const image = $getImageAfterRange(selection);
            if (image) {
              $selectImageNode(image);
              handled = true;
            }
          }
        });
        if (handled) {
          syncImageDomSelection(editor);
        }
        return handled;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const removeSelectionSync = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        syncImageDomSelection(editor);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const removeUpdateListener = editor.registerUpdateListener(() => {
      syncImageDomSelection(editor);
    });

    return () => {
      removeBackspace();
      removeDelete();
      removeSelectionSync();
      removeUpdateListener();
    };
  }, [editor]);

  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const wrapper = target.closest('[data-post-image]');
      if (!wrapper || !root.contains(wrapper)) {
        return;
      }
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(wrapper);
        if ($isImageNode(node)) {
          $selectImageNode(node);
        }
      });
      event.preventDefault();
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [editor]);

  return null;
}
