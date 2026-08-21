'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  type BaseSelection,
  type LexicalEditor,
} from 'lexical';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { createPortal } from 'react-dom';

import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import { useI18n } from '@/i18n/providers/i18n-provider';

import { insertObjectLinkAtSelection } from '../../application/insert-editor-object-link';
import { EditorInlineObjectSearch } from './editor-inline-object-search';
import { EditorInsertPhotoPanel } from './editor-insert-photo-panel';

const INSERT_BTN_SIZE_PX = 40;
const INSERT_BTN_RADIUS = INSERT_BTN_SIZE_PX / 2;

type InsertLabelKey =
  | 'editor_insert_photo'
  | 'editor_insert_video'
  | 'editor_insert_object'
  | 'editor_insert_line'
  | 'editor_insert_code'
  | 'editor_insert_table'
  | 'editor_insert_emoji'
  | 'editor_insert_nearby';

const INSERT_ITEMS: {
  labelKey: InsertLabelKey;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { labelKey: 'editor_insert_photo', Icon: IconPhoto },
  { labelKey: 'editor_insert_video', Icon: IconVideo },
  { labelKey: 'editor_insert_object', Icon: IconObject },
  { labelKey: 'editor_insert_line', Icon: IconLine },
  { labelKey: 'editor_insert_code', Icon: IconCode },
  { labelKey: 'editor_insert_table', Icon: IconTable },
  { labelKey: 'editor_insert_emoji', Icon: IconEmoji },
  { labelKey: 'editor_insert_nearby', Icon: IconNearby },
];

function IconPhoto({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconVideo({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconObject({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function IconLine({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
    </svg>
  );
}

function IconCode({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconTable({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function IconEmoji({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" />
    </svg>
  );
}

function IconNearby({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <path d="M11 8v6l3 1.5" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function getRangeForCaret(editorRoot: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const r = sel.getRangeAt(0);
    if (editorRoot.contains(r.commonAncestorContainer)) {
      return r;
    }
  }
  const firstBlock = editorRoot.querySelector('p, h1, h2, h3, h4, h5, h6');
  if (firstBlock && editorRoot.contains(firstBlock)) {
    const r = document.createRange();
    try {
      r.selectNodeContents(firstBlock);
      r.collapse(true);
      return r;
    } catch {
      return null;
    }
  }
  const r = document.createRange();
  try {
    r.selectNodeContents(editorRoot);
    r.collapse(true);
    return r;
  } catch {
    return null;
  }
}

/**
 * Collapsed DOM ranges in contenteditable often yield empty `getClientRects()` and
 * zero-height `getBoundingClientRect()`. Expand a clone by one character or use
 * a BR block rect so the + button can track the active line.
 */
function getCaretLineViewportRect(
  range: Range,
  editorRoot: HTMLElement,
): { top: number; height: number } | null {
  const rects = range.getClientRects();
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (r.height > 0.5) {
      return { top: r.top, height: r.height };
    }
  }

  let br = range.getBoundingClientRect();
  if (br.height > 0.5) {
    return { top: br.top, height: br.height };
  }

  const clone = range.cloneRange();
  if (!clone.collapsed) {
    br = clone.getBoundingClientRect();
    return br.height > 0.5 ? { top: br.top, height: br.height } : null;
  }

  const node = clone.startContainer;
  const offset = clone.startOffset;

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (offset < text.length) {
      clone.setEnd(node, offset + 1);
      br = clone.getBoundingClientRect();
      if (br.height > 0) {
        return { top: br.top, height: br.height };
      }
    }
    if (offset > 0) {
      const c2 = range.cloneRange();
      c2.setStart(node, offset - 1);
      c2.setEnd(node, offset);
      br = c2.getBoundingClientRect();
      if (br.height > 0) {
        return { top: br.top, height: br.height };
      }
    }
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    if (offset < el.childNodes.length) {
      const child = el.childNodes[offset];
      if (child.nodeName === 'BR') {
        const lineEl = el as HTMLElement;
        const lh =
          Number.parseFloat(getComputedStyle(lineEl).lineHeight) ||
          Number.parseFloat(getComputedStyle(lineEl).fontSize) * 1.25 ||
          22;
        const r = (child as HTMLBRElement).getBoundingClientRect();
        return { top: r.top, height: Math.max(r.height || lh * 0.8, lh * 0.85) };
      }
      if (child.nodeType === Node.TEXT_NODE && child.textContent) {
        const c3 = range.cloneRange();
        c3.setStart(child, 0);
        c3.setEnd(child, 1);
        br = c3.getBoundingClientRect();
        if (br.height > 0) {
          return { top: br.top, height: br.height };
        }
      }
    }
  }

  let block: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
  while (block && block !== editorRoot) {
    const display = getComputedStyle(block).display;
    if (display === 'block' || display === 'list-item' || block.tagName === 'LI') {
      break;
    }
    block = block.parentElement;
  }
  if (block && editorRoot.contains(block)) {
    const lh =
      Number.parseFloat(getComputedStyle(block).lineHeight) ||
      Number.parseFloat(getComputedStyle(block).fontSize) * 1.25 ||
      22;
    const blockRect = block.getBoundingClientRect();
    return { top: blockRect.top, height: lh };
  }

  const lh = Number.parseFloat(getComputedStyle(editorRoot).lineHeight) || 22;
  br = range.getBoundingClientRect();
  if (br.top > 0 || br.left > 0) {
    return { top: br.top, height: lh };
  }
  return null;
}

function scheduleMeasure(fn: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

function computeInsertOverlayTop(
  editor: LexicalEditor,
  container: HTMLElement,
): number | null {
  const root = editor.getRootElement();
  if (!root) {
    return null;
  }

  const range = getRangeForCaret(root);
  if (!range) {
    return null;
  }

  const line = getCaretLineViewportRect(range, root);
  if (!line) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const centerY = line.top + line.height / 2;
  const topPx = centerY - containerRect.top - INSERT_BTN_RADIUS;
  const maxTop = container.clientHeight - INSERT_BTN_SIZE_PX - 8;
  return Math.max(8, Math.min(maxTop, topPx));
}

export type EditorInsertCaretOverlayProps = {
  /** Single-line bar (e.g. comment): pin (+) to vertical center instead of caret line. */
  pinInsertCenterVertical?: boolean;
  /** When user picks an object from inline search (Insert → Object). */
  onObjectLinkedFromEditor?: (result: SearchObjectResult) => void;
};

/**
 * Positions the insert control on the left edge (straddling the border) and
 * vertically aligned with the current caret / active line.
 */
export function EditorInsertCaretOverlay({
  pinInsertCenterVertical = false,
  onObjectLinkedFromEditor,
}: EditorInsertCaretOverlayProps = {}) {
  const [editor] = useLexicalComposerContext();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [objectSearchOpen, setObjectSearchOpen] = useState(false);
  const [insertView, setInsertView] = useState<'grid' | 'photo'>('grid');
  const [buttonTop, setButtonTop] = useState(12);
  const [insertPanelCoords, setInsertPanelCoords] = useState<{
    top: number;
    left: number;
    placement: 'above' | 'below';
  } | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const objectSearchRef = useRef<HTMLDivElement>(null);
  const insertButtonRef = useRef<HTMLButtonElement>(null);
  const insertPanelRef = useRef<HTMLDivElement>(null);
  const insertTitleId = useId();
  const insertPanelId = useId();
  const comingSoon = t('app_header_coming_soon');
  const savedSelectionRef = useRef<BaseSelection | null>(null);

  const handleObjectSelect = useCallback(
    (result: SearchObjectResult) => {
      const saved = savedSelectionRef.current;
      if (saved) {
        editor.update(() => {
          $setSelection(saved);
        });
      }
      insertObjectLinkAtSelection(editor, result);
      onObjectLinkedFromEditor?.(result);
      savedSelectionRef.current = null;
      setObjectSearchOpen(false);
    },
    [editor, onObjectLinkedFromEditor],
  );

  const openObjectSearch = useCallback(() => {
    editor.getEditorState().read(() => {
      const sel = $getSelection();
      savedSelectionRef.current =
        $isRangeSelection(sel) ? sel.clone() : null;
    });
    const container = containerRef.current;
    if (container && !pinInsertCenterVertical) {
      const top = computeInsertOverlayTop(editor, container);
      if (top !== null) {
        setButtonTop(top);
      }
    }
    setOpen(false);
    setInsertView('grid');
    setObjectSearchOpen(true);
  }, [editor, pinInsertCenterVertical]);

  const measurePosition = useCallback(() => {
    if (pinInsertCenterVertical || objectSearchOpen) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const top = computeInsertOverlayTop(editor, container);
    setButtonTop(top ?? 12);
  }, [editor, objectSearchOpen, pinInsertCenterVertical]);

  useLayoutEffect(() => {
    if (pinInsertCenterVertical) {
      return;
    }
    scheduleMeasure(measurePosition);
    return editor.registerUpdateListener(() => {
      scheduleMeasure(measurePosition);
    });
  }, [editor, measurePosition, pinInsertCenterVertical]);

  useEffect(() => {
    if (pinInsertCenterVertical) {
      return;
    }
    const onSel = () => scheduleMeasure(measurePosition);
    document.addEventListener('selectionchange', onSel);
    const root = editor.getRootElement();
    const onRootActivity = () => scheduleMeasure(measurePosition);
    root?.addEventListener('scroll', measurePosition);
    root?.addEventListener('keyup', onRootActivity);
    root?.addEventListener('input', onRootActivity);
    root?.addEventListener('click', onRootActivity);
    window.addEventListener('resize', measurePosition);
    return () => {
      document.removeEventListener('selectionchange', onSel);
      root?.removeEventListener('scroll', measurePosition);
      root?.removeEventListener('keyup', onRootActivity);
      root?.removeEventListener('input', onRootActivity);
      root?.removeEventListener('click', onRootActivity);
      window.removeEventListener('resize', measurePosition);
    };
  }, [editor, measurePosition, pinInsertCenterVertical]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updateInsertPanelCoords = useCallback(() => {
    const btn = insertButtonRef.current;
    if (!btn) {
      setInsertPanelCoords(null);
      return;
    }
    const r = btn.getBoundingClientRect();
    const panelHeight = insertPanelRef.current?.offsetHeight ?? 240;
    const gap = 8;
    const spaceBelow = window.innerHeight - r.bottom - gap;
    const spaceAbove = r.top - gap;
    const openAbove =
      pinInsertCenterVertical ||
      (spaceBelow < panelHeight && spaceAbove > spaceBelow);

    setInsertPanelCoords({
      top: openAbove ? r.top - gap : r.bottom + gap,
      left: r.left + r.width / 2,
      placement: openAbove ? 'above' : 'below',
    });
  }, [pinInsertCenterVertical]);

  useLayoutEffect(() => {
    if (!open) {
      setInsertPanelCoords(null);
      return;
    }
    updateInsertPanelCoords();
    window.addEventListener('resize', updateInsertPanelCoords);
    window.addEventListener('scroll', updateInsertPanelCoords, true);
    return () => {
      window.removeEventListener('resize', updateInsertPanelCoords);
      window.removeEventListener('scroll', updateInsertPanelCoords, true);
    };
  }, [open, updateInsertPanelCoords]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updateInsertPanelCoords();
  }, [insertView, open, updateInsertPanelCoords]);

  useEffect(() => {
    if (!objectSearchOpen) {
      return;
    }
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        shellRef.current?.contains(target) ||
        objectSearchRef.current?.contains(target)
      ) {
        return;
      }
      if (target instanceof Element && target.closest('[role="listbox"]')) {
        return;
      }
      savedSelectionRef.current = null;
      setObjectSearchOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        savedSelectionRef.current = null;
        setObjectSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [objectSearchOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (shellRef.current?.contains(target) || insertPanelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (objectSearchOpen) {
          savedSelectionRef.current = null;
          setObjectSearchOpen(false);
        } else {
          setOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, objectSearchOpen]);

  return (
    <>
      <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[5] overflow-visible">
      <div
        ref={shellRef}
        className={[
          'pointer-events-auto absolute start-0 z-[70] -translate-x-1/2',
          pinInsertCenterVertical ? 'top-1/2 -translate-y-1/2' : '',
        ].join(' ')}
        style={pinInsertCenterVertical ? undefined : { top: buttonTop }}
      >
        {objectSearchOpen ? (
          <button
            ref={insertButtonRef}
            type="button"
            aria-label={t('close')}
            title={t('close')}
            onClick={() => {
              savedSelectionRef.current = null;
              setObjectSearchOpen(false);
            }}
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-circle border border-border',
              'bg-bg text-fg-secondary shadow-none',
              'hover:bg-ghost-surface',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            ].join(' ')}
          >
            <IconClose />
          </button>
        ) : (
          <button
            ref={insertButtonRef}
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-controls={open ? insertPanelId : undefined}
            aria-label={t('editor_insert_open_aria')}
            title={t('editor_insert_open_aria')}
            onClick={() => {
              setOpen((o) => {
                if (!o) {
                  setInsertView('grid');
                }
                return !o;
              });
            }}
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-circle border border-border',
              'bg-bg text-fg-secondary shadow-none',
              'hover:bg-ghost-surface',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            ].join(' ')}
          >
            <IconPlus />
          </button>
        )}
      </div>
      {objectSearchOpen ? (
        <div
          ref={objectSearchRef}
          className="pointer-events-auto absolute z-[70] flex items-center pe-3"
          style={{
            top: buttonTop,
            left: INSERT_BTN_RADIUS + 12,
            right: 0,
            height: INSERT_BTN_SIZE_PX,
          }}
        >
          <EditorInlineObjectSearch onSelect={handleObjectSelect} />
        </div>
      ) : null}
    </div>
    {portalReady &&
    open &&
    insertPanelCoords &&
    typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={insertPanelRef}
            id={insertPanelId}
            className={[
              'fixed z-[80] w-[min(100vw-2rem,20rem)] -translate-x-1/2 rounded-card border border-border',
              'bg-surface p-3 shadow-card',
              insertPanelCoords.placement === 'above' ? '-translate-y-full' : '',
            ].join(' ')}
            style={{ top: insertPanelCoords.top, left: insertPanelCoords.left }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={insertTitleId}
          >
            <div className="mb-3 flex items-center gap-2">
              {insertView === 'photo' ? (
                <button
                  type="button"
                  className="text-body-sm text-accent hover:underline"
                  onClick={() => setInsertView('grid')}
                >
                  {t('go_back')}
                </button>
              ) : null}
              <h2 id={insertTitleId} className="font-label text-body-sm text-heading">
                {insertView === 'photo'
                  ? t('editor_insert_photo')
                  : t('editor_insert_title')}
              </h2>
            </div>

            {insertView === 'photo' ? (
              <EditorInsertPhotoPanel
                onInserted={() => {
                  setOpen(false);
                  setInsertView('grid');
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {INSERT_ITEMS.map(({ labelKey, Icon }) => {
                  const isPhoto = labelKey === 'editor_insert_photo';
                  const isObject = labelKey === 'editor_insert_object';
                  const enabled = isPhoto || isObject;
                  return (
                    <button
                      key={labelKey}
                      type="button"
                      disabled={!enabled}
                      title={enabled ? undefined : comingSoon}
                      className={[
                        'flex flex-col items-center gap-1.5 rounded-btn px-2 py-3 text-body-sm',
                        enabled
                          ? 'bg-secondary text-secondary-fg hover:bg-surface-muted'
                          : 'bg-secondary text-secondary-fg opacity-70',
                      ].join(' ')}
                      onClick={
                        isPhoto
                          ? () => setInsertView('photo')
                          : isObject
                            ? () => openObjectSearch()
                            : undefined
                      }
                    >
                      <Icon className="text-fg-secondary" />
                      <span className="text-center leading-compressed">
                        {t(labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
