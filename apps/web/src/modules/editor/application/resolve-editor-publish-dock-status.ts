export type EditorPublishDockMessageKey =
  | 'linked_objects_remaining'
  | 'editor_post_not_ready_title_missing'
  | 'editor_post_not_ready_body_missing'
  | 'editor_post_not_ready_legal_missing'
  | 'ready_to_publish';

export type EditorPublishDockStatus = {
  messageKey: EditorPublishDockMessageKey;
  warning: boolean;
};

/**
 * Single dock status line: first blocking reason, or ready when publish is allowed.
 */
export function resolveEditorPublishDockStatus(params: {
  linkedObjectsOk: boolean;
  hasTitle: boolean;
  hasBody: boolean;
  legalAccepted: boolean;
}): EditorPublishDockStatus {
  if (!params.linkedObjectsOk) {
    return { messageKey: 'linked_objects_remaining', warning: true };
  }
  if (!params.hasTitle) {
    return {
      messageKey: 'editor_post_not_ready_title_missing',
      warning: true,
    };
  }
  if (!params.hasBody) {
    return {
      messageKey: 'editor_post_not_ready_body_missing',
      warning: true,
    };
  }
  if (!params.legalAccepted) {
    return {
      messageKey: 'editor_post_not_ready_legal_missing',
      warning: true,
    };
  }
  return { messageKey: 'ready_to_publish', warning: false };
}
