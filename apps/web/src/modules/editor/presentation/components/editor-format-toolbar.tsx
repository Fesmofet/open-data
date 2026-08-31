'use client';

import { $isLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type EditorState,
  type LexicalNode,
} from 'lexical';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { BoldIcon, ItalicIcon, LinkIcon, MoreHorizontalIcon } from '@/icons';
import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  applyFormatAction,
  getSelectedBlockType,
  registerSpoilerCommand,
  selectionHasSpoiler,
  type SelectedBlockType,
} from '../../application/apply-format-action';
import { MORE_ACTIONS, type FormatActionId } from '../../domain/format-actions';

const TOOLBAR_GAP_PX = 8;
const VIEWPORT_EDGE_PX = 8;

type ToolbarPosition = {
  top: number;
  left: number;
};

/** Keeps Lexical selection on toolbar buttons; allows focus in URL input. */
function preventToolbarMouseDown(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    event.preventDefault();
    return;
  }
  if (target.closest('input, textarea')) {
    return;
  }
  event.preventDefault();
}

function getSelectionViewportRect(root: HTMLElement | null): DOMRect | null {
  if (!root) {
    return null;
  }
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) {
    return null;
  }
  const range = domSelection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) {
    return null;
  }
  const rect = range.getBoundingClientRect();
  if (rect.width === 0) {
    return null;
  }
  return rect;
}

function selectionIsLink(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  for (const node of selection.getNodes()) {
    let current: LexicalNode | null = node;
    while (current !== null) {
      if ($isLinkNode(current)) {
        return true;
      }
      current = current.getParent();
    }
  }
  return false;
}

function toolbarBtnClass(active: boolean): string {
  return [
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-fg transition-colors',
    'hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    active ? 'bg-accent text-accent-fg' : '',
  ].join(' ');
}

function isBlockActive(blockType: SelectedBlockType, actionId: FormatActionId): boolean {
  if (actionId === 'quote') {
    return blockType === 'quote';
  }
  if (actionId === 'h1' || actionId === 'h2' || actionId === 'h3') {
    return blockType === actionId;
  }
  return false;
}

export function EditorFormatToolbar() {
  const [editor] = useLexicalComposerContext();
  const { t } = useI18n();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const toolbarId = useId();
  const moreMenuId = useId();

  const [portalReady, setPortalReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState<SelectedBlockType>('paragraph');
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const savedStateRef = useRef<EditorState | null>(null);
  const lastRectRef = useRef<DOMRect | null>(null);

  const syncToolbar = useCallback(() => {
    const root = editor.getRootElement();
    const rect = getSelectionViewportRect(root);
    if (rect) {
      lastRectRef.current = rect;
    }

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        if (!linkMode) {
          setVisible(false);
          setMoreOpen(false);
        }
        return;
      }
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsCode(selection.hasFormat('code'));
      setIsLink(selectionIsLink());
      setBlockType(getSelectedBlockType());
      setHasSpoiler(selectionHasSpoiler());
    });

    const layoutRect = rect ?? (linkMode ? lastRectRef.current : null);
    if (!layoutRect) {
      if (!linkMode) {
        setVisible(false);
        setPosition(null);
      }
      return;
    }

    const toolbarEl = toolbarRef.current;
    const toolbarHeight = toolbarEl?.offsetHeight ?? 40;
    const toolbarWidth = toolbarEl?.offsetWidth ?? 200;
    const centerX = layoutRect.left + layoutRect.width / 2;
    const clampedLeft = Math.max(
      VIEWPORT_EDGE_PX + toolbarWidth / 2,
      Math.min(window.innerWidth - VIEWPORT_EDGE_PX - toolbarWidth / 2, centerX),
    );
    const top = Math.max(
      VIEWPORT_EDGE_PX,
      layoutRect.top - toolbarHeight - TOOLBAR_GAP_PX,
    );

    setPosition({ top, left: clampedLeft });
    if (rect) {
      setVisible(true);
    }
  }, [editor, linkMode]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    return registerSpoilerCommand(editor);
  }, [editor]);

  useLayoutEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        syncToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, syncToolbar]);

  useEffect(() => {
    const root = editor.getRootElement();
    const onActivity = () => syncToolbar();
    document.addEventListener('selectionchange', onActivity);
    root?.addEventListener('scroll', onActivity);
    window.addEventListener('resize', onActivity);
    return () => {
      document.removeEventListener('selectionchange', onActivity);
      root?.removeEventListener('scroll', onActivity);
      window.removeEventListener('resize', onActivity);
    };
  }, [editor, syncToolbar]);

  useEffect(() => {
    if (!moreOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        toolbarRef.current?.contains(target) ||
        moreMenuRef.current?.contains(target)
      ) {
        return;
      }
      setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [moreOpen]);

  useLayoutEffect(() => {
    if (!linkMode) {
      return;
    }
    const input = linkInputRef.current;
    if (!input) {
      return;
    }
    input.focus({ preventScroll: true });
    input.select();
  }, [linkMode]);

  const runAction = useCallback(
    (actionId: FormatActionId) => {
      applyFormatAction(editor, actionId);
      setMoreOpen(false);
      requestAnimationFrame(() => syncToolbar());
    },
    [editor, syncToolbar],
  );

  const openLinkMode = useCallback(() => {
    savedStateRef.current = editor.getEditorState();
    setLinkMode(true);
    setLinkUrl('');
    setMoreOpen(false);
    requestAnimationFrame(() => syncToolbar());
  }, [editor, syncToolbar]);

  const cancelLinkMode = useCallback(() => {
    const saved = savedStateRef.current;
    if (saved) {
      editor.setEditorState(saved);
    }
    savedStateRef.current = null;
    setLinkMode(false);
    setLinkUrl('');
    requestAnimationFrame(() => syncToolbar());
  }, [editor, syncToolbar]);

  const submitLink = useCallback(() => {
    const url = linkUrl.trim();
    if (!url) {
      cancelLinkMode();
      return;
    }
    const saved = savedStateRef.current;
    if (saved) {
      editor.setEditorState(saved);
    }
    applyFormatAction(editor, 'link', { linkUrl: url });
    savedStateRef.current = null;
    setLinkMode(false);
    setLinkUrl('');
    requestAnimationFrame(() => syncToolbar());
  }, [cancelLinkMode, editor, linkUrl, syncToolbar]);

  const showToolbar = visible || linkMode;
  if (!portalReady || !showToolbar || !position) {
    return null;
  }

  const comingSoon = t('app_header_coming_soon');

  const toolbar = (
    <div
      ref={toolbarRef}
      id={toolbarId}
      role="toolbar"
      aria-label={t('editor_format_toolbar_aria')}
      className="fixed z-[100] flex items-center gap-0.5 rounded-btn border border-border bg-surface p-1 shadow-card"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={preventToolbarMouseDown}
    >
      {linkMode ? (
        <>
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder={t('editor_format_link_url')}
            className="h-8 min-w-[12rem] max-w-[20rem] rounded-btn border border-border bg-bg px-2 text-body text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitLink();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelLinkMode();
              }
            }}
          />
          <button
            type="button"
            className="h-8 shrink-0 rounded-btn bg-accent px-3 text-body-sm font-weight-label text-accent-fg hover:opacity-90"
            onClick={submitLink}
          >
            {t('editor_format_link_apply')}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={toolbarBtnClass(isBold)}
            aria-label={t('editor_format_bold')}
            aria-pressed={isBold}
            onClick={() => runAction('bold')}
          >
            <BoldIcon size={18} />
          </button>
          <button
            type="button"
            className={toolbarBtnClass(isItalic)}
            aria-label={t('editor_format_italic')}
            aria-pressed={isItalic}
            onClick={() => runAction('italic')}
          >
            <ItalicIcon size={18} />
          </button>
          <button
            type="button"
            className={toolbarBtnClass(isLink)}
            aria-label={t('editor_format_link')}
            aria-pressed={isLink}
            onClick={openLinkMode}
          >
            <LinkIcon size={18} />
          </button>
          <div className="relative">
            <button
              type="button"
              className={toolbarBtnClass(moreOpen)}
              aria-label={t('editor_format_more')}
              aria-expanded={moreOpen}
              aria-controls={moreMenuId}
              onClick={() => setMoreOpen((open) => !open)}
            >
              <MoreHorizontalIcon size={18} />
            </button>
            {moreOpen ? (
              <div
                ref={moreMenuRef}
                id={moreMenuId}
                role="menu"
                className="absolute start-0 top-full z-[101] mt-1 min-w-[10rem] rounded-btn border border-border bg-surface py-1 shadow-card"
              >
                {MORE_ACTIONS.map((action) => {
                  const active =
                    action.id === 'spoiler'
                      ? hasSpoiler
                      : action.id === 'code'
                        ? isCode
                        : isBlockActive(blockType, action.id);
                  const isMentionStub = action.id === 'mention';
                  return (
                    <button
                      key={action.id}
                      type="button"
                      role="menuitem"
                      disabled={isMentionStub}
                      title={isMentionStub ? comingSoon : undefined}
                      className={[
                        'flex w-full items-center px-3 py-1.5 text-start text-body text-fg',
                        'hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50',
                        active ? 'text-accent' : '',
                      ].join(' ')}
                      aria-pressed={active}
                      onClick={() => {
                        if (!isMentionStub) {
                          runAction(action.id);
                        }
                      }}
                    >
                      {t(action.labelKey)}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );

  return createPortal(toolbar, document.body);
}
