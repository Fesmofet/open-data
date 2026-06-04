import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import { DEFAULT_LOCALE } from '@/i18n/config/default-locale';

import { buildObjectId } from '../domain/generate-object-id';
import {
  applyContentLocaleToFields,
} from '../domain/field-content-locale';
import type { FieldEntry, ObjectCreateState } from '../domain/object-create.types';
import { loadObjectCreateDraft } from './object-create-draft.storage';

function normalizeFieldEntries(fields: FieldEntry[]): FieldEntry[] {
  return fields.map((f, index) => ({
    ...f,
    entryKey: f.entryKey ?? `${f.updateType}:${index}`,
  }));
}

function nameFromFields(fields: readonly FieldEntry[]): string {
  const entry = fields.find((f) => f.updateType === UPDATE_TYPES.NAME);
  if (!entry || typeof entry.value !== 'string') {
    return '';
  }
  return entry.value;
}

function resolvePrefixFromDraft(
  draft: Partial<ObjectCreateState> | null,
  fallback: string,
): string {
  if (draft?.objectIdPrefix && /^[a-z]{3}$/.test(draft.objectIdPrefix)) {
    return draft.objectIdPrefix;
  }
  const match = draft?.objectId?.match(/^([a-z]{3})(?:-|$)/);
  if (match?.[1]) {
    return match[1];
  }
  return fallback;
}

export function emptyObjectCreateState(prefix: string): ObjectCreateState {
  return {
    objectIdPrefix: prefix,
    objectId: prefix,
    objectType: null,
    fields: [],
    language: DEFAULT_LOCALE,
  };
}

export function isEmptyObjectCreateWorkspace(state: ObjectCreateState): boolean {
  return !state.objectType && state.fields.length === 0;
}

function mergeDraft(username: string, defaultPrefix: string): ObjectCreateState {
  const draft = loadObjectCreateDraft(username);
  const objectIdPrefix = resolvePrefixFromDraft(draft, defaultPrefix);
  const language = draft?.language ?? DEFAULT_LOCALE;
  const rawFields = normalizeFieldEntries(draft?.fields ?? []);
  const fields = applyContentLocaleToFields(rawFields, language);
  const name = nameFromFields(fields);
  const objectId =
    draft?.objectId && draft.objectId.length > 0
      ? draft.objectId
      : buildObjectId(objectIdPrefix, name);

  return {
    objectIdPrefix,
    objectId,
    objectType: draft?.objectType ?? null,
    fields,
    language,
  };
}

/**
 * Opening object-create from the post editor must not restore an unrelated
 * localStorage draft (e.g. a previous recipe workspace).
 */
export function resolveInitialObjectCreateState(
  username: string,
  defaultPrefix: string,
  editorReturnPath: string | null | undefined,
): ObjectCreateState {
  if (editorReturnPath) {
    return emptyObjectCreateState(defaultPrefix);
  }
  return mergeDraft(username, defaultPrefix);
}
