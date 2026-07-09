import 'server-only';

import { z } from 'zod';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';

const objectOptionEntrySchema = z.object({
  object_id: z.string(),
  category: z.string(),
  value: z.string(),
  position: z.number(),
  image: z.string().nullable(),
  price: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

const objectOptionsResponseSchema = z.object({
  object_id: z.string(),
  options: z.record(z.string(), z.array(objectOptionEntrySchema)),
});

export type ObjectOptionsApiResponse = z.infer<typeof objectOptionsResponseSchema>;

export async function fetchObjectOptions(
  objectId: string,
  init?: { locale?: string; viewer?: string | null },
): Promise<ObjectOptionsApiResponse | null> {
  const path = `/query/v1/objects/${encodeURIComponent(objectId)}/options`;
  const headers: Record<string, string> = {};
  const locale = init?.locale?.trim();
  if (locale) {
    headers['Accept-Language'] = locale;
    headers['X-Locale'] = locale;
  }
  const viewer = init?.viewer?.trim();
  if (viewer) {
    headers['X-Viewer'] = viewer;
  }

  const raw = await queryApiFetch<unknown>(path, { headers });
  if (raw == null) {
    return null;
  }

  const parsed = objectOptionsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}
