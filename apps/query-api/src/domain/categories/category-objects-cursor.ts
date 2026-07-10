import { z } from 'zod';

const categoryObjectsCursorSchema = z.object({
  object_id: z.string().min(1),
  /** Driver/JSON may deliver numeric weight as string — coerce for stable keyset paging. */
  weight: z.union([z.null(), z.coerce.number()]),
});

export type CategoryObjectsCursorPayload = z.infer<typeof categoryObjectsCursorSchema>;

export function encodeCategoryObjectsCursor(payload: CategoryObjectsCursorPayload): string {
  const weight =
    payload.weight != null && Number.isFinite(Number(payload.weight))
      ? Number(payload.weight)
      : null;
  return Buffer.from(
    JSON.stringify({ weight, object_id: payload.object_id }),
    'utf8',
  ).toString('base64url');
}

export function decodeCategoryObjectsCursor(raw: string): CategoryObjectsCursorPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const json = Buffer.from(trimmed, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    const result = categoryObjectsCursorSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
