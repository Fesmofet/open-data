import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  GetUserEngineTokenDelegationsEndpoint,
  GetUserWaivWalletEndpoint,
  type EngineTokenDelegationsResponse,
  type WaivWalletResponse,
} from '../domain/wallet';

@Controller({ path: 'users', version: '1' })
export class UserWalletController {
  constructor(
    private readonly getUserWaivWallet: GetUserWaivWalletEndpoint,
    private readonly getUserEngineTokenDelegations: GetUserEngineTokenDelegationsEndpoint,
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
