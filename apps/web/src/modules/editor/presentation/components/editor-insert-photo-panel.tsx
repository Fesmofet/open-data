'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { IpfsImageDropZone } from '@/shared/presentation';

import { insertImageAtSelection } from '../../application/insert-editor-image';

export type EditorInsertPhotoPanelProps = {
  onInserted: () => void;
};

export function EditorInsertPhotoPanel({ onInserted }: EditorInsertPhotoPanelProps) {
  const [editor] = useLexicalComposerContext();

  return (
    <IpfsImageDropZone
      compact
      hideLegend
      onUploaded={(result) => {
        insertImageAtSelection(editor, {
          src: result.previewUrl,
          cid: result.cid,
          altText: '',
        });
        onInserted();
      }}
    />
  );
}
