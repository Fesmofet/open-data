import { Test } from '@nestjs/testing';

import { UpsertHiveWalletExemptionEndpoint } from './upsert-hive-wallet-exemption.endpoint';
import { WalletExemptionsRepository } from '../../repositories';

describe('UpsertHiveWalletExemptionEndpoint', () => {
  let exemptions: jest.Mocked<
    Pick<WalletExemptionsRepository, 'upsertExemption' | 'deleteExemption'>
  >;
  let endpoint: UpsertHiveWalletExemptionEndpoint;

  beforeEach(async () => {
    exemptions = {
      upsertExemption: jest.fn().mockResolvedValue(true),
      deleteExemption: jest.fn().mockResolvedValue(true),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpsertHiveWalletExemptionEndpoint,
        { provide: WalletExemptionsRepository, useValue: exemptions },
      ],
    }).compile();

    endpoint = moduleRef.get(UpsertHiveWalletExemptionEndpoint);
  });

  it('upserts when checked', async () => {
    const result = await endpoint.execute({
      viewer: 'Alice',
      account: 'alice',
      operationIndex: 42,
      checked: true,
    });

    expect(result.result).toBe(true);
    expect(exemptions.upsertExemption).toHaveBeenCalledWith({
      viewer: 'alice',
      account: 'alice',
      operationIndex: 42,
    });
  });

  it('deletes when unchecked', async () => {
    await endpoint.execute({
      viewer: 'alice',
      account: 'alice',
      operationIndex: 42,
      checked: false,
    });

    expect(exemptions.deleteExemption).toHaveBeenCalled();
    expect(exemptions.upsertExemption).not.toHaveBeenCalled();
  });
});
