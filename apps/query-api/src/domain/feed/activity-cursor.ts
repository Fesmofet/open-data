import { z } from 'zod';

const cursorPayloadSchema = z.object({
  operationIndex: z.number().int().nonnegative(),
});

export type ActivityCursorPayload = z.infer<typeof cursorPayloadSchema>;

export function encodeActivityCursor(payload: ActivityCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeActivityCursor(raw: string): ActivityCursorPayload | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    const result = cursorPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
