import {
  hiveAccountCreatedDatesResponseSchema,
  type HiveAccountCreatedDatesRequest,
  type HiveAccountCreatedDatesResult,
} from '../../application/dto/hive-account-created-dates-api.schema';

export async function fetchHiveAccountCreatedDatesClient(
  body: HiveAccountCreatedDatesRequest,
  signal?: AbortSignal,
): Promise<HiveAccountCreatedDatesResult> {
  try {
    const res = await fetch('/api/wallet/hive/account-created-dates', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal,
    });
    if (!res.ok) {
      return { ok: false, error: 'unavailable' };
    }
    const json: unknown = await res.json();
    const parsed = hiveAccountCreatedDatesResponseSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: 'invalid_response' };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}
