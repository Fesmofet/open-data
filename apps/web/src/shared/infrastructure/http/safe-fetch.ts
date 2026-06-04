export type SafeFetchFailure = 'network' | 'timeout';

export type SafeFetchResult =
  | { ok: true; response: Response }
  | { ok: false; failure: SafeFetchFailure };

/**
 * Wraps `fetch` so connection refused, DNS, and timeout errors return a result
 * instead of throwing (Server Actions must not throw on expected outages).
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<SafeFetchResult> {
  try {
    const response = await fetch(input, init);
    return { ok: true, response };
  } catch (err) {
    const failure: SafeFetchFailure =
      err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'network';
    return { ok: false, failure };
  }
}
