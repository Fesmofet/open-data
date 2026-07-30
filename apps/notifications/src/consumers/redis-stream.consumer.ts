import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientFactory } from '@opden-data-layer/clients';
import {
  notificationEventSchema,
  type AnyNotificationEvent,
} from '@opden-data-layer/notifications-contract';
import {
  NOTIFICATION_CONSUMER_GROUP,
  NOTIFICATION_LOG_EVERY_N_EVENTS,
  NOTIFICATION_ROUTE_MAX_ATTEMPTS,
  NOTIFICATION_STREAM_BATCH_SIZE,
  NOTIFICATION_STREAM_DATA_FIELD,
  NOTIFICATION_STREAM_KEY,
} from '../constants/notification-stream.constants';
import { NotificationRouterService } from '../domain/notification-router.service';
import type { INotificationConsumer } from './notification-consumer.interface';

@Injectable()
export class RedisStreamNotificationConsumer implements INotificationConsumer {
  private readonly logger = new Logger(RedisStreamNotificationConsumer.name);
  private readonly consumerName: string;
  private running = false;
  private loopPromise: Promise<void> | null = null;
  private processedSinceLog = 0;
  private logWindowStartMs = Date.now();

  constructor(
    private readonly config: ConfigService,
    private readonly redisFactory: RedisClientFactory,
    private readonly router: NotificationRouterService,
  ) {
    this.consumerName =
      this.config.get<string>('consumer.name') ?? 'notifications-1';
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }
    const redis = this.redisFactory.getClient();
    await redis.xGroupCreate(
      NOTIFICATION_STREAM_KEY,
      NOTIFICATION_CONSUMER_GROUP,
      '$',
      true,
    );
    this.running = true;
    // Recovering our own pending entries can take a while; do not block application bootstrap.
    this.loopPromise = this.drainOwnPending().then(() => this.pollLoop());
    this.logger.log(
      `Redis stream consumer started (group=${NOTIFICATION_CONSUMER_GROUP}, consumer=${this.consumerName})`,
    );
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.loopPromise) {
      await this.loopPromise;
    }
    this.logger.log('Redis stream consumer stopped');
  }

  private async drainOwnPending(): Promise<void> {
    const redis = this.redisFactory.getClient();
    let drained = 0;
    try {
      while (this.running) {
        const entries = await redis.xReadGroup(
          NOTIFICATION_CONSUMER_GROUP,
          this.consumerName,
          [{ key: NOTIFICATION_STREAM_KEY, id: '0' }],
          { count: NOTIFICATION_STREAM_BATCH_SIZE },
        );
        if (entries.length === 0) {
          break;
        }
        drained += await this.processBatch(entries);
      }
    } catch (err) {
      this.logger.error(`Pending drain failed: ${(err as Error).message}`);
    }
    if (drained > 0) {
      this.logger.log(
        `Drained ${drained} pending notification stream entries for ${this.consumerName}`,
      );
    }
  }

  private async pollLoop(): Promise<void> {
    const redis = this.redisFactory.getClient();
    while (this.running) {
      try {
        const entries = await redis.xReadGroup(
          NOTIFICATION_CONSUMER_GROUP,
          this.consumerName,
          [{ key: NOTIFICATION_STREAM_KEY, id: '>' }],
          { count: NOTIFICATION_STREAM_BATCH_SIZE, blockMs: 2000 },
        );

        if (entries.length === 0) {
          continue;
        }

        const processed = await this.processBatch(entries);
        this.recordThroughput(processed);
      } catch (err) {
        if (this.running) {
          this.logger.error(`Stream poll error: ${(err as Error).message}`);
          await this.sleep(1000);
        }
      }
    }
  }

  /**
   * Routes the whole batch at once, then acks every entry.
   * Entries are acked even on routing failure so a poison batch cannot stall the stream.
   * @returns number of acked entries
   */
  private async processBatch(
    entries: { id: string; fields: Record<string, string> }[],
  ): Promise<number> {
    const events: AnyNotificationEvent[] = [];
    for (const entry of entries) {
      const event = this.parseEntry(entry.id, entry.fields);
      if (event) {
        events.push(event);
      }
    }

    if (events.length > 0) {
      await this.routeWithRetry(events);
    }

    const ackIds = entries.map((entry) => entry.id);
    await this.redisFactory
      .getClient()
      .xAck(NOTIFICATION_STREAM_KEY, NOTIFICATION_CONSUMER_GROUP, ...ackIds);
    return ackIds.length;
  }

  private async routeWithRetry(events: AnyNotificationEvent[]): Promise<void> {
    for (let attempt = 1; attempt <= NOTIFICATION_ROUTE_MAX_ATTEMPTS; attempt++) {
      try {
        await this.router.routeBatch(events);
        return;
      } catch (err) {
        if (attempt < NOTIFICATION_ROUTE_MAX_ATTEMPTS) {
          continue;
        }
        this.logger.error(
          `Failed to route batch of ${events.length} after ${NOTIFICATION_ROUTE_MAX_ATTEMPTS} attempt(s): ${(err as Error).message}`,
        );
      }
    }
  }

  private recordThroughput(count: number): void {
    this.processedSinceLog += count;
    if (this.processedSinceLog < NOTIFICATION_LOG_EVERY_N_EVENTS) {
      return;
    }
    const elapsedMs = Date.now() - this.logWindowStartMs;
    const rate =
      elapsedMs > 0
        ? ((this.processedSinceLog / elapsedMs) * 1000).toFixed(1)
        : '0';
    this.logger.log(
      `Processed ${this.processedSinceLog} notification events (${rate}/s over last ${elapsedMs}ms)`,
    );
    this.processedSinceLog = 0;
    this.logWindowStartMs = Date.now();
  }

  private parseEntry(
    entryId: string,
    fields: Record<string, string>,
  ): AnyNotificationEvent | null {
    const raw = fields[NOTIFICATION_STREAM_DATA_FIELD];
    if (!raw) {
      this.logger.warn(`Stream entry ${entryId} missing data field`);
      return null;
    }

    let parsed: ReturnType<typeof notificationEventSchema.safeParse>;
    try {
      parsed = notificationEventSchema.safeParse(JSON.parse(raw));
    } catch {
      this.logger.warn(`Stream entry ${entryId} has invalid JSON`);
      return null;
    }

    if (!parsed.success) {
      this.logger.warn(`Stream entry ${entryId} failed schema validation`);
      return null;
    }

    return parsed.data;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
