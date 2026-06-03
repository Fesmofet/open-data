'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

import { registerInsertImageCommand } from '../../application/insert-editor-image';

export function EditorRegisterImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerInsertImageCommand(editor);
  }, [editor]);

  return null;
}
