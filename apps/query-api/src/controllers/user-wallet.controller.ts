import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
} from '@nestjs/common';
import {
  GetUserEngineTokenDelegationsEndpoint,
  GetUserHiveHpDelegationsEndpoint,
  GetUserHiveRcDelegationsEndpoint,
  GetUserHiveWalletEndpoint,
  GetUserWaivWalletEndpoint,
  GetUserWaivWalletHistoryEndpoint,
  type EngineTokenDelegationsResponse,
  type HiveHpDelegationsResponse,
  type HiveRcDelegationsResponse,
  type HiveWalletResponse,
  type WaivWalletResponse,
  type WaivWalletHistoryResponse,
  waivWalletHistoryBodySchema,
  type WaivWalletHistoryBody,
} from '../domain/wallet';
import { ZodBodyPipe } from '../pipes';

@Controller({ path: 'users', version: '1' })
export class UserWalletController {
  constructor(
    private readonly getUserWaivWallet: GetUserWaivWalletEndpoint,
    private readonly getUserWaivWalletHistory: GetUserWaivWalletHistoryEndpoint,
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

  @Post(':name/wallet/waiv/history')
  async getWaivWalletHistory(
    @Param('name') name: string,
    @Body(new ZodBodyPipe(waivWalletHistoryBodySchema)) body: WaivWalletHistoryBody,
  ): Promise<WaivWalletHistoryResponse> {
    const result = await this.getUserWaivWalletHistory.execute(name, body);
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
