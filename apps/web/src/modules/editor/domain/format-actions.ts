/**
 * Registry of editor formatting actions. Primary toolbar buttons (Bold, Italic,
 * Link, More) are fixed in the UI; extend formatting by adding entries to
 * {@link MORE_ACTIONS} and handling the id in apply-format-action.
 */

export type FormatActionId =
  | 'bold'
  | 'italic'
  | 'link'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'code'
  | 'spoiler'
  | 'mention';

export type FormatActionLabelKey =
  | 'editor_format_bold'
  | 'editor_format_italic'
  | 'editor_format_link'
  | 'editor_format_h1'
  | 'editor_format_h2'
  | 'editor_format_h3'
  | 'editor_format_quote'
  | 'editor_format_code'
  | 'editor_format_spoiler'
  | 'editor_format_mention';

export type FormatAction = {
  id: FormatActionId;
  labelKey: FormatActionLabelKey;
};

/** Fixed primary toolbar — not driven by this list in the component. */
export const PRIMARY_ACTION_IDS = ['bold', 'italic', 'link'] as const satisfies readonly FormatActionId[];

export type PrimaryFormatActionId = (typeof PRIMARY_ACTION_IDS)[number];

/** More-menu actions; add new formatting here without changing the primary bar. */
export const MORE_ACTIONS: readonly FormatAction[] = [
  { id: 'h1', labelKey: 'editor_format_h1' },
  { id: 'h2', labelKey: 'editor_format_h2' },
  { id: 'h3', labelKey: 'editor_format_h3' },
  { id: 'quote', labelKey: 'editor_format_quote' },
  { id: 'code', labelKey: 'editor_format_code' },
  { id: 'spoiler', labelKey: 'editor_format_spoiler' },
  { id: 'mention', labelKey: 'editor_format_mention' },
] as const;
