'use client';

import { createLinkMatcherWithRegExp } from '@lexical/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
} from 'lexical';
import { useEffect, useMemo, useRef } from 'react';

import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';
import { imageContentUrlForCid } from '@/config/ipfs-content-url';
import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';

import {
  isLexicalDraftJson,
  migrateLegacyImageNodeTypes,
  normalizeImageNodeSrcFromCid,
  serializeEditorState,
} from '../../application/editor-body-serialization';
import { POST_EDITOR_NODES } from '../../domain/editor-lexical-nodes';
import { EditorFormatToolbar } from './editor-format-toolbar';
import { EditorImageDropOverlay } from './editor-image-drop-overlay';
import { EditorInsertCaretOverlay } from './editor-insert-menu';
import { EditorImageKeyboardPlugin } from './editor-image-keyboard-plugin';
import { EditorPasteImagePlugin } from './editor-paste-image-plugin';
import { EditorRegisterImagePlugin } from './editor-register-image-plugin';

const URL_REG_EXP =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const lexicalTheme = {
  paragraph: 'mb-2 text-body text-fg font-weight-body leading-body',
  quote:
    'mb-2 border-s-4 border-border ps-4 text-body italic text-fg-secondary leading-body',
  heading: {
    h1: 'mb-2 font-display text-section text-heading leading-display',
    h2: 'mb-2 font-display text-body-lg text-heading leading-body',
    h3: 'mb-2 font-display text-body text-heading leading-body',
    h4: 'mb-1 font-display text-body-sm text-heading leading-compressed',
    h5: 'mb-1 font-label text-body-sm text-heading leading-compressed',
    h6: 'mb-1 font-label text-caption text-fg-secondary leading-compressed',
  },
  list: {
    ul: 'mb-2 list-disc ps-6 text-body text-fg leading-body',
    ol: 'mb-2 list-decimal ps-6 text-body text-fg leading-body',
    listitem: 'mb-0.5',
    nested: {
      listitem: 'list-none before:hidden',
    },
  },
  link: 'text-link underline underline-offset-2 hover:text-accent-alt',
  image: 'my-2 block w-full overflow-hidden rounded-card',
  text: {
    bold: 'font-weight-strong',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'rounded-btn bg-surface-muted px-0.5 font-mono text-body-sm',
    spoiler:
      'cursor-pointer rounded-btn bg-surface-muted px-0.5 text-fg hover:bg-accent/20',
  },
};

function Placeholder({
  text,
  compact,
  pillChrome,
}: {
  text: string;
  compact?: boolean;
  pillChrome?: boolean;
}) {
  return (
    <div
      className={[
        'pointer-events-none absolute text-body text-fg-tertiary select-none',
        pillChrome ? 'start-10 top-1/2 -translate-y-1/2' : compact ? 'start-8 top-2' : 'start-8 top-3',
      ].join(' ')}
    >
      {text}
    </div>
  );
}

function seedPlainTextBody(editor: import('lexical').LexicalEditor, text: string) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    const lines = text.split('\n');
    for (const line of lines) {
      const p = $createParagraphNode();
      p.append($createTextNode(line));
      root.append(p);
    }
  });
}

function InitialBodyPlugin({ body }: { body?: string }) {
  const [editor] = useLexicalComposerContext();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) {
      return;
    }
    const trimmed = body?.trim() ?? '';
    if (!trimmed) {
      applied.current = true;
      return;
    }
    applied.current = true;

    if (isLexicalDraftJson(trimmed)) {
      const migrated = migrateLegacyImageNodeTypes(trimmed);
      const state = editor.parseEditorState(migrated);
      editor.setEditorState(state);
      if (contentBaseUrl) {
        normalizeImageNodeSrcFromCid(
          editor,
          contentBaseUrl,
          imageContentUrlForCid,
        );
      }
      return;
    }

    seedPlainTextBody(editor, trimmed);
  }, [body, contentBaseUrl, editor]);

  return null;
}

function LexicalAutoLinkConfigured() {
  const matchers = useMemo(
    () => [createLinkMatcherWithRegExp(URL_REG_EXP, (text) => text)],
    [],
  );
  return <AutoLinkPlugin matchers={matchers} />;
}

function EditorBodyOnChangePlugin({
  onBodyChange,
  plainTextOnly,
}: {
  onBodyChange?: (body: string) => void;
  plainTextOnly?: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(editorState) => {
        if (!onBodyChange) {
          return;
        }
        if (plainTextOnly) {
          editorState.read(() => {
            onBodyChange($getRoot().getTextContent());
          });
          return;
        }
        onBodyChange(serializeEditorState(editor));
      }}
    />
  );
}

function EditorInner({
  bodyPlaceholder,
  initialBody,
  onBodyChange,
  compact,
  compactBottomInset,
  showFormatToolbar,
  enableImages,
  onObjectLinkedFromEditor,
}: {
  bodyPlaceholder: string;
  initialBody?: string;
  onBodyChange?: (body: string) => void;
  compact?: boolean;
  compactBottomInset?: boolean;
  showFormatToolbar?: boolean;
  enableImages?: boolean;
  onObjectLinkedFromEditor?: (result: SearchObjectResult) => void;
}) {
  const pillChrome = Boolean(compact && compactBottomInset);

  const minHeightClass = pillChrome
    ? 'min-h-11 max-h-32 resize-y overflow-y-auto'
    : compact
      ? 'min-h-[2rem]'
      : 'min-h-[12rem]';
  const verticalPadClass = pillChrome ? 'py-1.5' : compact ? 'py-2' : 'py-3';
  const padHorizontalClass = pillChrome ? 'ps-10 pe-4' : 'px-4 ps-8';

  return (
    <>
      {initialBody ? <InitialBodyPlugin body={initialBody} /> : null}
      <EditorBodyOnChangePlugin
        onBodyChange={onBodyChange}
        plainTextOnly={compact}
      />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={[
              'relative resize-y text-body text-fg outline-none',
              padHorizontalClass,
              verticalPadClass,
              minHeightClass,
              'focus-visible:outline-none',
            ].join(' ')}
          />
        }
        placeholder={
          <Placeholder text={bodyPlaceholder} compact={compact} pillChrome={pillChrome} />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <LexicalAutoLinkConfigured />
      {showFormatToolbar ? <EditorFormatToolbar /> : null}
      {enableImages ? (
        <>
          <EditorRegisterImagePlugin />
          <EditorPasteImagePlugin />
          <EditorImageKeyboardPlugin />
        </>
      ) : null}
    </>
  );
}

export type LexicalEditorProps = {
  bodyPlaceholder: string;
  /** Lexical JSON or legacy plain-text seed (e.g. draft body). */
  initialBody?: string;
  /** Fired when body changes (Lexical JSON for post editor, plain text when `compact`). */
  onBodyChange?: (body: string) => void;
  /** Insert → Object: add to linked metadata when not already attached. */
  onObjectLinkedFromEditor?: (result: SearchObjectResult) => void;
  /** @deprecated Use `initialBody`. */
  initialPlainText?: string;
  /** @deprecated Use `onBodyChange`. */
  onPlainTextChange?: (text: string) => void;
  compact?: boolean;
  compactBottomInset?: boolean;
};

export function LexicalPostEditor({
  bodyPlaceholder,
  initialBody,
  onBodyChange,
  onObjectLinkedFromEditor,
  initialPlainText,
  onPlainTextChange,
  compact,
  compactBottomInset,
}: LexicalEditorProps) {
  const pillChrome = Boolean(compact && compactBottomInset);
  const enableImages = !compact;
  const resolvedInitialBody = initialBody ?? initialPlainText;
  const resolvedOnBodyChange = onBodyChange ?? onPlainTextChange;

  const initialConfig = useMemo(
    () => ({
      namespace: 'PostEditor',
      theme: {
        ...lexicalTheme,
        paragraph: pillChrome
          ? 'mb-0 text-body text-fg font-weight-body leading-body'
          : lexicalTheme.paragraph,
      },
      onError: (error: Error) => {
        console.error(error);
      },
      nodes: [...POST_EDITOR_NODES],
    }),
    [pillChrome],
  );

  const shellMinClass = pillChrome
    ? 'min-h-11 max-h-32'
    : compact
      ? 'min-h-[2rem]'
      : 'min-h-[12rem]';
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={[
          'relative w-full overflow-visible rounded-card border border-border bg-surface shadow-card',
          shellMinClass,
        ].join(' ')}
      >
        <EditorInner
          bodyPlaceholder={bodyPlaceholder}
          initialBody={resolvedInitialBody}
          onBodyChange={resolvedOnBodyChange}
          compact={compact}
          compactBottomInset={compactBottomInset}
          showFormatToolbar={enableImages}
          enableImages={enableImages}
          onObjectLinkedFromEditor={onObjectLinkedFromEditor}
        />
        {enableImages ? <EditorImageDropOverlay /> : null}
        <EditorInsertCaretOverlay
          pinInsertCenterVertical={pillChrome}
          onObjectLinkedFromEditor={onObjectLinkedFromEditor}
        />
      </div>
    </LexicalComposer>
  );
}
