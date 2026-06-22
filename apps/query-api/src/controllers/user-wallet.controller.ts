import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  GetUserEngineTokenDelegationsEndpoint,
  GetUserHiveHpDelegationsEndpoint,
  GetUserHiveRcDelegationsEndpoint,
  GetUserHiveWalletEndpoint,
  GetUserWaivWalletEndpoint,
  type EngineTokenDelegationsResponse,
  type HiveHpDelegationsResponse,
  type HiveRcDelegationsResponse,
  type HiveWalletResponse,
  type WaivWalletResponse,
} from '../domain/wallet';

@Controller({ path: 'users', version: '1' })
export class UserWalletController {
  constructor(
    private readonly getUserWaivWallet: GetUserWaivWalletEndpoint,
    private readonly getUserEngineTokenDelegations: GetUserEngineTokenDelegationsEndpoint,
    private readonly getUserHiveWallet: GetUserHiveWalletEndpoint,
    private readonly getUserHiveHpDelegations: GetUserHiveHpDelegationsEndpoint,
    private readonly getUserHiveRcDelegations: GetUserHiveRcDelegationsEndpoint,
  ) {}

  @Get(':name/wallet/waiv')
  async getWaivWallet(
    @Param('name') name: string,
  ): Promise<WaivWalletResponse> {
    const result = await this.getUserWaivWallet.execute(name);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Get(':name/wallet/hive')
  async getHiveWallet(
    @Param('name') name: string,
  ): Promise<HiveWalletResponse> {
    const result = await this.getUserHiveWallet.execute(name);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Get(':name/wallet/hive/delegations')
  async getHiveHpDelegations(
    @Param('name') name: string,
  ): Promise<HiveHpDelegationsResponse> {
    const result = await this.getUserHiveHpDelegations.execute(name);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Get(':name/wallet/hive/rc-delegations')
  async getHiveRcDelegations(
    @Param('name') name: string,
  ): Promise<HiveRcDelegationsResponse> {
    const result = await this.getUserHiveRcDelegations.execute(name);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Get(':name/wallet/engine/:symbol/delegations')
  async getEngineTokenDelegations(
    @Param('name') name: string,
    @Param('symbol') symbol: string,
  ): Promise<EngineTokenDelegationsResponse> {
    const result = await this.getUserEngineTokenDelegations.execute(name, symbol);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }
}
