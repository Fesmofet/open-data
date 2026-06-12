/** Minimal shape for WAIV reward history aggregation (Hive Engine account history). */
export type WaivHistoryEntry = {
  authorperm?: string;
  quantity: string;
};

const HOUR_SEC = 3600;

/** Legacy Waivio cashout history window (created + 6d23h .. created + 7d5h). */
export function waivCashoutHistoryWindow(createdUnix: number): {
  timestampStart: number;
  timestampEnd: number;
} {
  const timestampStart = createdUnix + (24 * 6 + 23) * HOUR_SEC;
  const timestampEnd = createdUnix + (24 * 7 + 5) * HOUR_SEC;
  return { timestampStart, timestampEnd };
}

function sumMatchedQuantities(
  entries: WaivHistoryEntry[],
  authorperm: string,
): number {
  let total = 0;
  for (const entry of entries) {
    if (entry.authorperm !== authorperm) {
      continue;
    }
    const qty = parseFloat(entry.quantity);
    if (Number.isFinite(qty)) {
      total += qty;
    }
  }
  return total;
}

/**
 * Sums author+beneficiary reward history entries and doubles (legacy display total).
 */
export function sumWaivAuthorBeneficiaryFromHistory(
  entries: WaivHistoryEntry[],
  authorperm: string,
): number {
  return Number((sumMatchedQuantities(entries, authorperm) * 2).toFixed(8));
}

/** Sums curation reward history entries without doubling. */
export function sumWaivCurationFromHistory(
  entries: WaivHistoryEntry[],
  authorperm: string,
): number {
  return Number(sumMatchedQuantities(entries, authorperm).toFixed(8));
}

/** Author+beneficiary (×2) + curation (no ×2). */
export function computeWaivPaidFromHistory(
  authorBenEntries: WaivHistoryEntry[],
  curationEntries: WaivHistoryEntry[],
  authorperm: string,
): number {
  const authorBen = sumWaivAuthorBeneficiaryFromHistory(authorBenEntries, authorperm);
  const curation = sumWaivCurationFromHistory(curationEntries, authorperm);
  return Number((authorBen + curation).toFixed(8));
}
