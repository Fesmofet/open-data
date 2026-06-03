'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';

import { useIpfsImageUpload } from '@/shared/application';

import { insertImageAtSelection } from '../../application/insert-editor-image';

export function EditorImageDropOverlay() {
  const [editor] = useLexicalComposerContext();
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasImageFile, setHasImageFile] = useState(false);

  const { uploadFile } = useIpfsImageUpload((result) => {
    insertImageAtSelection(editor, {
      src: result.previewUrl,
      cid: result.cid,
      altText: '',
    });
  });

  useEffect(() => {
    const onWindowDragEnter = (e: DragEvent) => {
      const types = e.dataTransfer?.types;
      if (types?.includes('Files')) {
        setHasImageFile(true);
      }
    };
    const onWindowDragEnd = () => {
      setHasImageFile(false);
      setIsDragOver(false);
    };
    window.addEventListener('dragenter', onWindowDragEnter);
    window.addEventListener('dragend', onWindowDragEnd);
    window.addEventListener('drop', onWindowDragEnd);
    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter);
      window.removeEventListener('dragend', onWindowDragEnd);
      window.removeEventListener('drop', onWindowDragEnd);
    };
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    const file = e.dataTransfer.items[0];
    if (file?.kind === 'file' && file.type.startsWith('image/')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setHasImageFile(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  if (!hasImageFile) {
    return null;
  }

  return (
    <div
      className={[
        'pointer-events-auto absolute inset-0 z-[20] rounded-card',
        isDragOver
          ? 'border-2 border-dashed border-accent bg-accent/10'
          : '',
      ].join(' ')}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-hidden
    />
  );
}
