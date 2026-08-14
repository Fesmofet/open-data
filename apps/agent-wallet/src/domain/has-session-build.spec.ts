import { ConfigService } from '@nestjs/config';

import {
  buildGalleryItemBroadcastOp,
  buildValidatedUpdateCreateOp,
} from '@opden-data-layer/hive-broadcast';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { HasSessionService } from './has-session.service';

jest.mock('@opden-data-layer/hive-broadcast', () => {
  const actual = jest.requireActual('@opden-data-layer/hive-broadcast');
  return {
    ...actual,
    buildValidatedUpdateCreateOp: jest.fn(),
    buildGalleryItemBroadcastOp: jest.fn(),
  };
});

describe('HasSessionService ODL build helpers', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'odlCustomJsonId') {
        return 'odl-testnet';
      }
      return undefined;
    }),
  } as unknown as ConfigService<AgentWalletConfig, true>;

  const service = new HasSessionService(
    config,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('buildUpdateCreate returns a single validated op', () => {
    const mockedOp = {
      type: 'custom_json',
      id: 'odl-testnet',
      json: '{"events":[{"action":"update_create"}]}',
      required_auths: [],
      required_posting_auths: ['alice'],
    };
    (buildValidatedUpdateCreateOp as jest.Mock).mockReturnValue(mockedOp);

    const result = service.buildUpdateCreate({
      objectId: 'recipe-demo',
      creator: 'alice',
      updateType: 'image',
      value: { cid: 'QmTest' },
    });

    expect(buildValidatedUpdateCreateOp).toHaveBeenCalledWith({
      id: 'odl-testnet',
      objectId: 'recipe-demo',
      creator: 'alice',
      updateType: 'image',
      value: { cid: 'QmTest' },
      locale: undefined,
      language: undefined,
    });
    expect(result.ops).toEqual([mockedOp]);
    expect(result.opsCount).toBe(1);
    expect(result.bytes).toBeGreaterThan(0);
  });

  it('buildGalleryItem normalizes creator and passes album names', () => {
    const mockedOp = {
      type: 'custom_json',
      id: 'odl-testnet',
      json: '{"events":[{"action":"update_create"}]}',
      required_auths: [],
      required_posting_auths: ['alice'],
    };
    (buildGalleryItemBroadcastOp as jest.Mock).mockReturnValue(mockedOp);

    const result = service.buildGalleryItem({
      objectId: ' recipe-demo ',
      creator: '@Alice',
      itemValue: { album: 'Photos', cid: 'QmTest' },
      existingGalleryAlbumNames: ['Menu'],
    });

    expect(buildGalleryItemBroadcastOp).toHaveBeenCalledWith({
      id: 'odl-testnet',
      objectId: 'recipe-demo',
      creator: 'alice',
      itemValue: { album: 'Photos', cid: 'QmTest' },
      onChainGalleryAlbumNames: ['Menu'],
    });
    expect(result.opsCount).toBe(1);
  });
});
