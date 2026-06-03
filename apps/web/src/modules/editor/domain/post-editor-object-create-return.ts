export const EDITOR_OBJECT_CREATE_RETURN_QUERY = 'return';

export const EDITOR_ATTACH_OBJECT_QUERY = 'attachObject';

const EDITOR_PATH = '/editor';

const DRAFT_ID_PARAM = 'draftId';

const PERMLINK_PARAM = 'permlink';

/** Safe fragment for draftId / permlink query values. */
const EDITOR_QUERY_VALUE_PATTERN = /^[a-zA-Z0-9-]+$/;

export type EditorDraftPathParams = {
  draftId?: string | null;
  permlink?: string | null;
};

export function buildEditorDraftPath(params: EditorDraftPathParams = {}): string {
  const draftId = params.draftId?.trim() ?? '';
  const permlink = params.permlink?.trim() ?? '';
  if (draftId && EDITOR_QUERY_VALUE_PATTERN.test(draftId)) {
    return `${EDITOR_PATH}?${DRAFT_ID_PARAM}=${encodeURIComponent(draftId)}`;
  }
  if (permlink && EDITOR_QUERY_VALUE_PATTERN.test(permlink)) {
    return `${EDITOR_PATH}?${PERMLINK_PARAM}=${encodeURIComponent(permlink)}`;
  }
  return EDITOR_PATH;
}

export function buildObjectCreateHrefFromEditor(
  params: EditorDraftPathParams = {},
): string {
  const editorPath = buildEditorDraftPath(params);
  const qs = new URLSearchParams();
  qs.set(EDITOR_OBJECT_CREATE_RETURN_QUERY, editorPath);
  return `/object-create?${qs.toString()}`;
}

/**
 * Validates a relative return path for object-create → editor only.
 * Returns normalized path (pathname + search) or null if unsafe/invalid.
 */
export function parseObjectCreateReturnPath(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  let decoded = raw.trim();
  if (!decoded) {
    return null;
  }
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (
    decoded.includes('://') ||
    decoded.startsWith('//') ||
    decoded.includes('..') ||
    !decoded.startsWith(EDITOR_PATH)
  ) {
    return null;
  }

  const qIndex = decoded.indexOf('?');
  const pathname = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;
  if (pathname !== EDITOR_PATH) {
    return null;
  }

  if (qIndex < 0) {
    return EDITOR_PATH;
  }

  const search = decoded.slice(qIndex + 1);
  const params = new URLSearchParams(search);
  const keys = [...params.keys()];
  if (keys.length === 0) {
    return EDITOR_PATH;
  }

  const allowed = new Set([DRAFT_ID_PARAM, PERMLINK_PARAM]);
  if (keys.some((k) => !allowed.has(k))) {
    return null;
  }
  if (params.has(DRAFT_ID_PARAM) && params.has(PERMLINK_PARAM)) {
    return null;
  }

  const draftId = params.get(DRAFT_ID_PARAM)?.trim() ?? '';
  const permlink = params.get(PERMLINK_PARAM)?.trim() ?? '';
  if (draftId && !EDITOR_QUERY_VALUE_PATTERN.test(draftId)) {
    return null;
  }
  if (permlink && !EDITOR_QUERY_VALUE_PATTERN.test(permlink)) {
    return null;
  }
  if (!draftId && !permlink) {
    return EDITOR_PATH;
  }

  const out = new URLSearchParams();
  if (draftId) {
    out.set(DRAFT_ID_PARAM, draftId);
  }
  if (permlink) {
    out.set(PERMLINK_PARAM, permlink);
  }
  const outQs = out.toString();
  return outQs ? `${EDITOR_PATH}?${outQs}` : EDITOR_PATH;
}

export function appendAttachObjectToEditorPath(
  editorPath: string,
  objectId: string,
): string {
  const id = objectId.trim();
  if (!id) {
    return editorPath;
  }
  const base = parseObjectCreateReturnPath(editorPath) ?? EDITOR_PATH;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${EDITOR_ATTACH_OBJECT_QUERY}=${encodeURIComponent(id)}`;
}

/** Removes `attachObject` from an editor URL; keeps validated draftId/permlink only. */
export function stripAttachObjectFromEditorPath(pathWithSearch: string): string {
  if (!pathWithSearch.startsWith(EDITOR_PATH)) {
    return EDITOR_PATH;
  }
  const qIndex = pathWithSearch.indexOf('?');
  if (qIndex < 0) {
    return EDITOR_PATH;
  }
  const params = new URLSearchParams(pathWithSearch.slice(qIndex + 1));
  const draftId = params.get(DRAFT_ID_PARAM)?.trim() ?? '';
  const permlink = params.get(PERMLINK_PARAM)?.trim() ?? '';
  return buildEditorDraftPath({ draftId: draftId || null, permlink: permlink || null });
}
