import { Inject, Injectable } from '@nestjs/common';
import type { Kysely, Transaction } from 'kysely';
import { sql } from 'kysely';
import type { JsonValue } from '@opden-data-layer/core';
import { KYSELY } from '../database';
import type { Database } from '../database/types';

export type JobTrigger = 'scheduled' | 'manual' | 'retry';

export type ClaimedSchedulerQueueItem = {
  queueId: string;
  runId: string;
  jobName: string;
  /** attempts value after this claim (1-based try index) */
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  payload: JsonValue | null;
  trigger: JobTrigger;
};

@Injectable()
export class SchedulerRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  private executor(trx?: Transaction<Database>): Kysely<Database> {
    return trx ?? this.db;
  }

  async hasIncompleteRun(
    jobName: string,
    trx?: Transaction<Database>,
  ): Promise<boolean> {
    return (await this.countIncompleteRuns(jobName, trx)) > 0;
  }

  async countIncompleteRuns(
    jobName: string,
    trx?: Transaction<Database>,
  ): Promise<number> {
    const r = await this.executor(trx)
      .selectFrom('scheduler_job_runs as r')
      .innerJoin('scheduler_job_queue as q', 'q.run_id', 'r.id')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('r.job_name', '=', jobName)
      .where('r.status', 'in', ['pending', 'running'])
      .where('q.status', 'in', ['pending', 'claimed'])
      .executeTakeFirst();
    return Number(r?.n ?? 0);
  }

  async insertSkippedRun(
    jobName: string,
    trigger: JobTrigger,
  ): Promise<string> {
    const row = await this.db
      .insertInto('scheduler_job_runs')
      .values({
        job_name: jobName,
        trigger,
        status: 'skipped',
        attempt: 0,
        started_at: null,
        finished_at: new Date(),
        duration_ms: 0,
        error: 'overlap: incomplete run already exists',
        payload: null,
        created_at: new Date(),
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }

  /**
   * Inserts a pending run and queue row. Caller should hold the enqueue Redis lock.
   */
  async insertRunWithQueue(
    jobName: string,
    trigger: JobTrigger,
    maxAttempts: number,
    payload: JsonValue | null,
  ): Promise<{ runId: string; queueId: string }> {
    return this.db.transaction().execute(async (trx) => {
      const run = await trx
        .insertInto('scheduler_job_runs')
        .values({
          job_name: jobName,
          trigger,
          status: 'pending',
          attempt: 0,
          started_at: null,
          finished_at: null,
          duration_ms: null,
          error: null,
          payload: payload ?? null,
          created_at: new Date(),
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      const q = await trx
        .insertInto('scheduler_job_queue')
        .values({
          run_id: run.id,
          job_name: jobName,
          status: 'pending',
          available_at: new Date(),
          attempts: 0,
          max_attempts: maxAttempts,
          last_error: null,
          claimed_at: null,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      return { runId: run.id, queueId: q.id };
    });
  }

  /**
   * Claims work; bumps queue.attempts and sets status=claimed, claimed_at=now().
   */
  async claimBatch(
    limit: number,
  ): Promise<ClaimedSchedulerQueueItem[]> {
    const { rows } = await sql<{
      qid: string;
      rid: string;
      jn: string;
      attempts: number;
      maxAttempts: number;
      lastError: string | null;
      payload: JsonValue | null;
      tg: string;
    }>`
      WITH picked AS (
        SELECT q2.id
        FROM scheduler_job_queue q2
        WHERE q2.status = 'pending'
          AND q2.available_at <= NOW()
        ORDER BY q2.available_at ASC, q2.id ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      ),
      upd AS (
        UPDATE scheduler_job_queue q
        SET
          status = 'claimed',
          attempts = q.attempts + 1,
          claimed_at = NOW()
        WHERE q.id IN (SELECT id FROM picked)
        RETURNING
          q.id,
          q.run_id,
          q.job_name,
          q.attempts,
          q.max_attempts,
          q.last_error
      )
      SELECT
        u.id as "qid",
        u.run_id as "rid",
        u.job_name as "jn",
        u.attempts as "attempts",
        u.max_attempts as "maxAttempts",
        u.last_error as "lastError",
        r.payload,
        r.trigger as "tg"
      FROM upd u
      INNER JOIN scheduler_job_runs r ON r.id = u.run_id
    `.execute(this.db);

    return rows.map((r) => ({
      queueId: r.qid,
      runId: r.rid,
      jobName: r.jn,
      attempts: r.attempts,
      maxAttempts: r.maxAttempts,
      lastError: r.lastError,
      payload: r.payload,
      trigger: r.tg as JobTrigger,
    }));
  }

  async setRunToRunning(
    runId: string,
    attempt: number,
  ): Promise<void> {
    await this.db
      .updateTable('scheduler_job_runs')
      .set({
        status: 'running',
        attempt,
        started_at: new Date(),
        finished_at: null,
        duration_ms: null,
        error: null,
      })
      .where('id', '=', runId)
      .execute();
  }

  async completeSuccess(
    runId: string,
    queueId: string,
    durationMs: number,
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      const now = new Date();
      await trx
        .updateTable('scheduler_job_runs')
        .set({
          status: 'success',
          finished_at: now,
          duration_ms: durationMs,
          error: null,
        })
        .where('id', '=', runId)
        .execute();
      await trx
        .updateTable('scheduler_job_queue')
        .set({ status: 'done' })
        .where('id', '=', queueId)
        .execute();
    });
  }

  async failAndRequeue(
    runId: string,
    queueId: string,
    errMsg: string,
    retryAfterMs: number,
  ): Promise<void> {
    const next = new Date(Date.now() + retryAfterMs);
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('scheduler_job_queue')
        .set({
          status: 'pending',
          available_at: next,
          last_error: errMsg,
          claimed_at: null,
        })
        .where('id', '=', queueId)
        .execute();
      // run stays in 'running' until final outcome
    });
  }

  /**
   * Reclaims queue items left in `claimed` after a worker crash and fails incomplete
   * runs that would otherwise block scheduling or clog the worker queue.
   */
  async recoverStaleWork(
    staleClaimSec: number,
    staleRunSec: number,
  ): Promise<{ reclaimedClaims: number; failedRuns: number }> {
    const claimSec = Math.max(60, staleClaimSec);
    const runSec = Math.max(claimSec, staleRunSec);

    return this.db.transaction().execute(async (trx) => {
      const reclaimed = await sql<{ id: string; run_id: string }>`
        UPDATE scheduler_job_queue
        SET status = 'pending', claimed_at = NULL
        WHERE status = 'claimed'
          AND claimed_at < NOW() - (${claimSec} * INTERVAL '1 second')
        RETURNING id, run_id
      `.execute(trx);

      const reclaimedRunIds = [
        ...new Set(reclaimed.rows.map((row) => row.run_id)),
      ];

      let failedFromReclaim = 0;
      if (reclaimedRunIds.length > 0) {
        const reclaimedFails = await sql<{ id: string }>`
          UPDATE scheduler_job_runs r
          SET
            status = 'failed',
            finished_at = NOW(),
            duration_ms = NULL,
            error = 'stale: reclaimed expired claim'
          WHERE r.id IN (${sql.join(reclaimedRunIds.map((id) => sql.lit(id)))})
            AND r.status IN ('pending', 'running')
          RETURNING r.id
        `.execute(trx);
        failedFromReclaim = reclaimedFails.rows.length;

        if (failedFromReclaim > 0) {
          await sql`
            UPDATE scheduler_job_queue q
            SET
              status = 'dead',
              last_error = 'stale: reclaimed claim expired',
              claimed_at = NULL
            WHERE q.run_id IN (${sql.join(reclaimedRunIds.map((id) => sql.lit(id)))})
              AND q.status IN ('pending', 'claimed')
          `.execute(trx);
        }
      }

      const failed = await sql<{ id: string }>`
        UPDATE scheduler_job_runs r
        SET
          status = 'failed',
          finished_at = NOW(),
          duration_ms = NULL,
          error = 'stale: incomplete run exceeded max age'
        WHERE r.status IN ('pending', 'running')
          AND r.created_at < NOW() - (${runSec} * INTERVAL '1 second')
        RETURNING r.id
      `.execute(trx);

      const failedRunIds = failed.rows.map((row) => row.id);
      if (failedRunIds.length > 0) {
        await sql`
          UPDATE scheduler_job_queue q
          SET
            status = 'dead',
            last_error = 'stale: parent run exceeded max age',
            claimed_at = NULL
          WHERE q.run_id IN (${sql.join(failedRunIds.map((id) => sql.lit(id)))})
            AND q.status IN ('pending', 'claimed')
        `.execute(trx);
      }

      const purged = await sql<{ id: string }>`
        UPDATE scheduler_job_queue q
        SET
          status = 'dead',
          last_error = 'stale: backlog queue item expired',
          claimed_at = NULL
        WHERE q.status IN ('pending', 'claimed')
          AND q.available_at < NOW() - (${runSec} * INTERVAL '1 second')
          AND EXISTS (
            SELECT 1
            FROM scheduler_job_runs r
            WHERE r.id = q.run_id
              AND r.status IN ('pending', 'running')
          )
        RETURNING q.id
      `.execute(trx);

      if (purged.rows.length > 0) {
        await sql`
          UPDATE scheduler_job_runs r
          SET
            status = 'failed',
            finished_at = NOW(),
            duration_ms = NULL,
            error = 'stale: backlog queue item expired'
          WHERE r.id IN (
            SELECT q.run_id
            FROM scheduler_job_queue q
            WHERE q.id IN (${sql.join(purged.rows.map((row) => sql.lit(row.id)))})
          )
            AND r.status IN ('pending', 'running')
        `.execute(trx);
      }

      return {
        reclaimedClaims: reclaimed.rows.length,
        failedRuns: failedFromReclaim + failed.rows.length + purged.rows.length,
      };
    });
  }

  async failPermanently(
    runId: string,
    queueId: string,
    errMsg: string,
    durationMs: number,
  ): Promise<void> {
    const now = new Date();
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('scheduler_job_runs')
        .set({
          status: 'failed',
          finished_at: now,
          duration_ms: durationMs,
          error: errMsg,
        })
        .where('id', '=', runId)
        .execute();
      await trx
        .updateTable('scheduler_job_queue')
        .set({ status: 'dead', last_error: errMsg, claimed_at: null })
        .where('id', '=', queueId)
        .execute();
    });
  }
}
