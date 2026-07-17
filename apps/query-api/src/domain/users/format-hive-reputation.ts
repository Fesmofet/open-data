/** Legacy `steem.formatter.reputation` — human-readable Hive reputation. */
export function formatHiveReputation(rawReputation: number | undefined): number {
  if (rawReputation == null || !Number.isFinite(rawReputation)) {
    return 25;
  }
  if (rawReputation === 0) {
    return 25;
  }

  const neg = rawReputation < 0;
  const rep = neg ? -rawReputation : rawReputation;
  let logRep = Math.log10(rep);
  logRep = Math.max(logRep - 9, 0);
  if (logRep < 0) {
    logRep = 0;
  }
  const formatted = logRep * 9 + 25;
  return neg ? -formatted : formatted;
}
