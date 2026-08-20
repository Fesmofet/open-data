import { Injectable, NotFoundException } from '@nestjs/common';
import { HiveClient } from '@opden-data-layer/clients';

export type MemoPublicKeyResponseDto = {
  account: string;
  memo_public_key: string;
};

@Injectable()
export class GetMemoPublicKeyEndpoint {
  constructor(private readonly hiveClient: HiveClient) {}

  async execute(account: string): Promise<MemoPublicKeyResponseDto> {
    const normalized = account.trim().toLowerCase();
    if (!normalized) {
      throw new NotFoundException('Account not found');
    }
    const accounts = await this.hiveClient.getAccounts([normalized]);
    const row = accounts[0];
    if (!row?.name || !row.memo_key) {
      throw new NotFoundException('Account not found');
    }
    return {
      account: row.name,
      memo_public_key: row.memo_key,
    };
  }
}
