import type { OdlEventContext } from '../../odl-shared';
import type { OblRepository } from '../../../repositories/obl.repository';
import { OfferRetireHandler } from './offer-retire.handler';
import { OblOffer } from '@opden-data-layer/odl-db-types';

describe('OfferRetireHandler', () => {
  it('retires all versions for offer_id', async () => {
    const retireAllOfferVersions = jest.fn().mockResolvedValue(undefined);
    const findLatestOffer = jest.fn().mockResolvedValue({
      offer_id: 'offer-1',
      version: 2,
      author: 'alice',
      status: 'active',
    } satisfies Partial<OblOffer>);

    const handler = new OfferRetireHandler({
      findLatestOffer,
      retireAllOfferVersions,
    } as unknown as OblRepository);

    await handler.handle(
      { offer_id: 'offer-1', author: 'alice' },
      {
        creator: 'alice',
      } as OdlEventContext,
    );

    expect(retireAllOfferVersions).toHaveBeenCalledWith('offer-1');
  });
});
