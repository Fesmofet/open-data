export function isPostCashout(cashoutTime: string | null | undefined): boolean {
  const raw = (cashoutTime ?? '').trim();
  if (raw === '') {
    return false;
  }
  const iso = raw.includes('Z') ? raw : `${raw}.000Z`;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    return false;
  }
  return ms < Date.now();
}
