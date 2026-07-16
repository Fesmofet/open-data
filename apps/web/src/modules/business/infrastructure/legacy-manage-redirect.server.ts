import { redirect } from 'next/navigation';

import type { OblOfferKindRoute } from '@/modules/business/domain/routes';

/** Redirect legacy `/business/{offers|requests}/...` paths to `/business/manage/...`. */
export function redirectLegacyManagePath(
  kind: OblOfferKindRoute,
  segments: readonly string[],
): never {
  const base =
    kind === 'request' ? '/business/manage/requests' : '/business/manage/offers';
  const suffix = segments.length > 0 ? `/${segments.join('/')}` : '';
  redirect(`${base}${suffix}`);
}
