import type { RankVoteProjection } from './projected-object.types';

/** Builds vote counts and viewer latest ranks per `update_id`. */
export function buildRankVoteProjection(
  voteCountRows: Array<{ update_id: string; n: number | bigint | string }>,
  viewerVoteRows: Array<{ update_id: string; rank: number; event_seq: bigint }>,
): RankVoteProjection {
  const countByUpdateId = new Map<string, number>();
  for (const row of voteCountRows) {
    const raw = typeof row.n === 'bigint' ? Number(row.n) : Number(row.n);
    if (Number.isFinite(raw)) {
      countByUpdateId.set(row.update_id, Math.trunc(raw));
    }
  }
  const latestByUpdate = new Map<string, { rank: number; seq: bigint }>();
  for (const row of viewerVoteRows) {
    const prev = latestByUpdate.get(row.update_id);
    if (!prev || row.event_seq > prev.seq) {
      latestByUpdate.set(row.update_id, { rank: row.rank, seq: row.event_seq });
    }
  }
  const viewerRankByUpdateId = new Map<string, number>();
  for (const [id, v] of latestByUpdate) {
    viewerRankByUpdateId.set(id, v.rank);
  }
  return { countByUpdateId, viewerRankByUpdateId };
}
