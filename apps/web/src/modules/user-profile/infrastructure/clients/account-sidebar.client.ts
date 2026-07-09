import type { UserAccountSidebarView } from '../../domain/types/user-account-sidebar-view';
import { userAccountSidebarViewSchema } from '../../application/dto/user-account-sidebar.dto';
import { queryApiFetch } from '../clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

export async function fetchUserAccountSidebar(
  accountName: string,
): Promise<UserAccountSidebarView | null> {
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/account-sidebar`;
  const data = await queryApiFetch<unknown>(path, {
    cacheTags: [queryApiCacheTags.userAccountSidebar(accountName)],
  });
  if (data === null) {
    return null;
  }
  const parsed = userAccountSidebarViewSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid account sidebar response: ${JSON.stringify(parsed.error.flatten())}`,
    );
  }
  return parsed.data;
}
