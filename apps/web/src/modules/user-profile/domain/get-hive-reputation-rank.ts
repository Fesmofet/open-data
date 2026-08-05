/** i18n keys for Hive account rank labels (legacy UserInfo parity). */
export type HiveReputationRankKey =
  | 'rank_plankton'
  | 'rank_minnow'
  | 'rank_dolphin'
  | 'rank_orca'
  | 'rank_whale';

/**
 * Map formatted Hive reputation to legacy rank label key.
 * @see tmp/waivio-frontend-legacy UserInfo when available.
 */
export function getHiveReputationRankKey(
  formattedReputation: number,
): HiveReputationRankKey {
  if (formattedReputation < 25) {
    return 'rank_plankton';
  }
  if (formattedReputation < 35) {
    return 'rank_minnow';
  }
  if (formattedReputation < 50) {
    return 'rank_dolphin';
  }
  if (formattedReputation < 70) {
    return 'rank_orca';
  }
  return 'rank_whale';
}
