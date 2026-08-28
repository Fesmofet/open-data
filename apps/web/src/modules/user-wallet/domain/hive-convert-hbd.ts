/** HBD per HIVE from stored USD rates (approximates legacy feed median). */
export function deriveHbdPerHiveFromRates(
  hiveUsd: number,
  hbdUsd: number,
): number | null {
  if (
    !Number.isFinite(hiveUsd) ||
    !Number.isFinite(hbdUsd) ||
    hiveUsd <= 0 ||
    hbdUsd <= 0
  ) {
    return null;
  }
  return hiveUsd / hbdUsd;
}

/** Immediate partial HBD on HIVE→HBD convert (legacy ConvertHbdModal). */
export function computeImmediateHbdFromHiveConvert(
  hiveAmount: number,
  hbdPerHive: number,
): number {
  return (hiveAmount / 2) * 0.95 * hbdPerHive;
}

/** Full HBD receive estimate (To field) from USD rates. */
export function computeEstimatedHbdFromHiveConvert(
  hiveAmount: number,
  hiveUsd: number,
  hbdUsd: number,
): number | null {
  const hbdPerHive = deriveHbdPerHiveFromRates(hiveUsd, hbdUsd);
  if (hbdPerHive === null || hiveAmount <= 0) {
    return null;
  }
  return hiveAmount * hbdPerHive;
}
