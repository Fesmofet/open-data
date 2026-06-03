'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

import { useIpfsImageUpload } from '@/shared/application';
import {
  imageFileFromClipboard,
  parseHttpUrlFromPaste,
} from '@/modules/object-updates/application/image-cid-or-url-paste';

import { insertImageAtSelection } from '../../application/insert-editor-image';

function isFocusInEditorRoot(root: HTMLElement | null): boolean {
  if (!root) {
    return false;
  }
  const active = document.activeElement;
  return active !== null && root.contains(active);
}

export function EditorPasteImagePlugin() {
  const [editor] = useLexicalComposerContext();

  const { uploadFile, importFromUrl } = useIpfsImageUpload((result) => {
    insertImageAtSelection(editor, {
      src: result.previewUrl,
      cid: result.cid,
      altText: '',
    });
  });

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        if (!isFocusInEditorRoot(editor.getRootElement())) {
          return false;
        }

        const file = imageFileFromClipboard(event.clipboardData);
        if (file) {
          event.preventDefault();
          uploadFile(file);
          return true;
        }

        const pastedUrl = parseHttpUrlFromPaste(
          event.clipboardData?.getData('text/plain') ?? '',
        );
        if (pastedUrl) {
          event.preventDefault();
          importFromUrl(pastedUrl);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, importFromUrl, uploadFile]);

  return null;
}
