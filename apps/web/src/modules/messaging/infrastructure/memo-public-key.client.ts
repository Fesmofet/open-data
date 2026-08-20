'use client';

export type MemoPublicKeyResponse = {
  account: string;
  memo_public_key: string;
};

export async function fetchMemoPublicKey(account: string): Promise<MemoPublicKeyResponse> {
  const res = await fetch(`/api/users/${encodeURIComponent(account)}/memo-public-key`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Memo public key not found');
  }
  return (await res.json()) as MemoPublicKeyResponse;
}
