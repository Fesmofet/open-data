import { Injectable, Logger } from '@nestjs/common';
import { OblRepository } from '../../../repositories/obl.repository';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { offerRetirePayloadSchema } from '../obl-envelope.schema';

@Injectable()
export class OfferRetireHandler implements OdlActionHandler {
  readonly action = 'offer_retire';
  private readonly logger = new Logger(OfferRetireHandler.name);

  constructor(private readonly oblRepository: OblRepository) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const parsed = offerRetirePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid offer_retire payload: ${parsed.error.message}`);
      return;
    }
    const data = parsed.data;
    if (ctx.creator !== data.author) {
      this.logger.warn('offer_retire: creator mismatch');
      return;
    }

    const latest = await this.oblRepository.findLatestOffer(data.offer_id);
    if (!latest || latest.author !== data.author) {
      this.logger.warn('offer_retire: offer not found or unauthorized');
      return;
    }
    if (latest.status === 'retired') {
      return;
    }

    await this.oblRepository.retireAllOfferVersions(latest.offer_id);
  }
}
