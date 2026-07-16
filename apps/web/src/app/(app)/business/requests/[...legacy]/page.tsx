import { redirectLegacyManagePath } from '@/modules/business/infrastructure/legacy-manage-redirect.server';

export default async function LegacyRequestsManageRedirect({
  params,
}: {
  params: Promise<{ legacy: string[] }>;
}) {
  const { legacy } = await params;
  redirectLegacyManagePath('request', legacy);
}
