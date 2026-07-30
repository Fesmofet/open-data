import { EventEmitter2 } from '@nestjs/event-emitter';
import type { OdlEventContext } from '../../odl-shared';
import { UserMetadataHandler } from './user-metadata.handler';

const baseCtx: OdlEventContext = {
  action: 'update_user_metadata',
  creator: 'alice',
  blockNum: 10,
  transactionIndex: 0,
  operationIndex: 0,
  odlEventIndex: 0,
  transactionId: 'hive-trx-abc',
  timestamp: '2026-01-01T00:00:00.000Z',
  eventSeq: BigInt(1),
  eventIdIndexMap: new Map(),
};

const basePayload = {
  notifications_last_timestamp: 0,
  exit_page_setting: true,
  locale: 'en-US',
  post_locales: [],
  nightmode: false,
  reward_setting: '50',
  rewrite_links: false,
  show_nsfw_posts: false,
  upvote_setting: false,
  vote_percent: 5000,
  voting_power: true,
  currency: null,
  hide_linked_objects: false,
  hide_recipe_objects: false,
};

describe('UserMetadataHandler', () => {
  function createHandler(mocks: { upsertFull?: jest.Mock }) {
    const userMetadataRepository = {
      upsertFull: mocks.upsertFull ?? jest.fn().mockResolvedValue(undefined),
    };
    const eventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;
    const handler = new UserMetadataHandler(
      userMetadataRepository as never,
      eventEmitter,
    );
    return { handler, userMetadataRepository, eventEmitter };
  }

  it('upserts hide_favorite_objects when explicitly true', async () => {
    const upsertFull = jest.fn().mockResolvedValue(undefined);
    const { handler } = createHandler({ upsertFull });

    await handler.handle({ ...basePayload, hide_favorite_objects: true }, baseCtx);

    expect(upsertFull).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ hide_favorite_objects: true }),
    );
  });

  it('defaults hide_favorite_objects to false when omitted from payload', async () => {
    const upsertFull = jest.fn().mockResolvedValue(undefined);
    const { handler } = createHandler({ upsertFull });

    await handler.handle(basePayload, baseCtx);

    expect(upsertFull).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ hide_favorite_objects: false }),
    );
  });

  it('ignores invalid payload', async () => {
    const upsertFull = jest.fn();
    const { handler } = createHandler({ upsertFull });

    await handler.handle({ locale: 'en-US' }, baseCtx);

    expect(upsertFull).not.toHaveBeenCalled();
  });
});
