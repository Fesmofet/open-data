import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import {
  GetUserEngineTokenDelegationsEndpoint,
  GetUserHiveHpDelegationsEndpoint,
  GetUserHiveRcDelegationsEndpoint,
  GetUserHiveWalletEndpoint,
  GetUserWaivWalletEndpoint,
  GetUserWaivWalletHistoryEndpoint,
  GetUserEngineWalletEndpoint,
  GetUserEngineWalletHistoryEndpoint,
  GetUserEngineSwapListEndpoint,
  PostUserEngineSwapQuoteEndpoint,
  GetUserEngineDepositListEndpoint,
  GetUserEngineDepositAddressEndpoint,
  GetUserEngineWithdrawListEndpoint,
  PostUserEngineWithdrawQuoteEndpoint,
  type EngineTokenDelegationsResponse,
  type EngineWalletResponse,
  type EngineWalletHistoryResponse,
  type EngineWalletHistoryBody,
  engineWalletHistoryBodySchema,
  type EngineSwapListResponse,
  type EngineSwapQuoteBody,
  type EngineSwapQuoteResponse,
  engineSwapQuoteBodySchema,
  type EngineDepositListResponse,
  type EngineDepositAddressResponse,
  engineDepositAddressQuerySchema,
  type EngineDepositAddressQuery,
  type EngineWithdrawListResponse,
  type EngineWithdrawQuoteBody,
  type EngineWithdrawQuoteResponse,
  engineWithdrawQuoteBodySchema,
  type HiveHpDelegationsResponse,
  type HiveRcDelegationsResponse,
  type HiveWalletResponse,
  type WaivWalletResponse,
  type WaivWalletHistoryResponse,
  waivWalletHistoryBodySchema,
  type WaivWalletHistoryBody,
} from '../domain/wallet';
import { ZodBodyPipe, ZodQueryPipe } from '../pipes';

@Controller({ path: 'users', version: '1' })
export class UserWalletController {
  constructor(
    private readonly getUserWaivWallet: GetUserWaivWalletEndpoint,
    private readonly getUserWaivWalletHistory: GetUserWaivWalletHistoryEndpoint,
    private readonly getUserEngineWallet: GetUserEngineWalletEndpoint,
    private readonly getUserEngineWalletHistory: GetUserEngineWalletHistoryEndpoint,
    private readonly getUserEngineTokenDelegations: GetUserEngineTokenDelegationsEndpoint,
    private readonly getUserEngineSwapList: GetUserEngineSwapListEndpoint,
    private readonly postUserEngineSwapQuote: PostUserEngineSwapQuoteEndpoint,
    private readonly getUserEngineDepositList: GetUserEngineDepositListEndpoint,
    private readonly getUserEngineDepositAddress: GetUserEngineDepositAddressEndpoint,
    private readonly getUserEngineWithdrawList: GetUserEngineWithdrawListEndpoint,
    private readonly postUserEngineWithdrawQuote: PostUserEngineWithdrawQuoteEndpoint,
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

  @Get(':name/wallet/engine')
  async getEngineWallet(
    @Param('name') name: string,
  ): Promise<EngineWalletResponse> {
    const result = await this.getUserEngineWallet.execute(name);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Post(':name/wallet/engine/history')
  async getEngineWalletHistory(
    @Param('name') name: string,
    @Body(new ZodBodyPipe(engineWalletHistoryBodySchema))
    body: EngineWalletHistoryBody,
  ): Promise<EngineWalletHistoryResponse> {
    const result = await this.getUserEngineWalletHistory.execute(name, body);
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

  @Get(':name/wallet/engine/swap/list')
  async getEngineSwapList(
    @Param('name') name: string,
  ): Promise<EngineSwapListResponse> {
    const result = await this.getUserEngineSwapList.execute(name);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Post(':name/wallet/engine/swap/quote')
  async postEngineSwapQuote(
    @Param('name') name: string,
    @Body(new ZodBodyPipe(engineSwapQuoteBodySchema)) body: EngineSwapQuoteBody,
  ): Promise<EngineSwapQuoteResponse> {
    const result = await this.postUserEngineSwapQuote.execute(name, body);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Get(':name/wallet/engine/deposit/list')
  async getEngineDepositList(
    @Param('name') name: string,
  ): Promise<EngineDepositListResponse> {
    const result = await this.getUserEngineDepositList.execute(name);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Get(':name/wallet/engine/deposit/address')
  async getEngineDepositAddress(
    @Param('name') name: string,
    @Query(new ZodQueryPipe(engineDepositAddressQuerySchema))
    query: EngineDepositAddressQuery,
  ): Promise<EngineDepositAddressResponse> {
    const result = await this.getUserEngineDepositAddress.execute(name, query);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Get(':name/wallet/engine/withdraw/list')
  async getEngineWithdrawList(
    @Param('name') name: string,
  ): Promise<EngineWithdrawListResponse> {
    const result = await this.getUserEngineWithdrawList.execute(name);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }

  @Post(':name/wallet/engine/withdraw/quote')
  async postEngineWithdrawQuote(
    @Param('name') name: string,
    @Body(new ZodBodyPipe(engineWithdrawQuoteBodySchema))
    body: EngineWithdrawQuoteBody,
  ): Promise<EngineWithdrawQuoteResponse> {
    const result = await this.postUserEngineWithdrawQuote.execute(name, body);
    if (!result) {
      throw new NotFoundException(`User not found: ${name}`);
    }
    return result;
  }
}
