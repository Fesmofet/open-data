'use server';

import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { fetchNestedObjectsBatch } from '../../infrastructure/fetch-nested-objects.server';

function readStringField(fields: Record<string, unknown>, key: string): string | null {
  const value = fields[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** Resolves ref display (name, avatar) from object projection when search index is stale. */
export async function resolveObjectRefDisplayAction(
  objectId: string,
  appliesTo?: readonly string[],
): Promise<SearchObjectResult | null> {
  const trimmed = objectId.trim();
  if (!trimmed) {
    return null;
  }

  const locale = await getRequestLocale();
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const batch = await fetchNestedObjectsBatch([trimmed], {
    locale,
    viewer: user?.username ?? null,
    updateTypes: ['name', 'title', 'image'],
  });
  const item = batch.get(trimmed);
  if (!item) {
    return null;
  }
  if (appliesTo?.length && !appliesTo.includes(item.object_type)) {
    return null;
  }

  return {
    object_id: item.object_id,
    object_type: item.object_type,
    name:
      readStringField(item.fields, 'name') ??
      readStringField(item.fields, 'title') ??
      item.object_id,
    image_url: readStringField(item.fields, 'image'),
    parent_name: null,
  };
}
