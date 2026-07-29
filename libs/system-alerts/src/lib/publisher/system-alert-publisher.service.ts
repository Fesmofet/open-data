import { Injectable, Logger } from '@nestjs/common';
import { RedisClientFactory } from '@opden-data-layer/clients';
import {
  type SystemAlert,
  SYSTEM_ALERT_STREAM_DATA_FIELD,
  SYSTEM_ALERT_STREAM_KEY,
} from '../contract/system-alert';

@Injectable()
export class SystemAlertPublisherService {
  private readonly logger = new Logger(SystemAlertPublisherService.name);

  constructor(private readonly redisFactory: RedisClientFactory) {}

  async publish(alert: SystemAlert): Promise<void> {
    try {
      await this.redisFactory.getClient().xAdd(SYSTEM_ALERT_STREAM_KEY, {
        [SYSTEM_ALERT_STREAM_DATA_FIELD]: JSON.stringify(alert),
      });
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }
}
