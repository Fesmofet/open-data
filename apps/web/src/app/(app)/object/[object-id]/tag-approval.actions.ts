'use server';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import type { TagApprovalStatsIndex } from '@/modules/object/domain/tag-approval-stats';
import { loadTagApprovalStatsIndex } from '@/modules/object/infrastructure/tag-approval-stats.server';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function fetchTagApprovalStatsAction(
  objectId: string,
): Promise<TagApprovalStatsIndex> {
  const locale = await getRequestLocale();
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();

  return loadTagApprovalStatsIndex(objectId, {
    locale,
    viewer: user?.username ?? null,
  });
}
