import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  ETH_GATEWAY_CLIENT_MODULE_OPTIONS,
  type EthGatewayClientModuleOptions,
} from './eth-gateway-client.options';
import type { EthGatewayClientInterface } from './interface/eth-gateway-client.interface';
import type { EthGatewayWithdrawalFeeResponse } from './type';

const DEFAULT_BASE = 'https://ethgw.hive-engine.com';
const DEFAULT_TIMEOUT_MS = 12_000;

@Injectable()
export class EthGatewayClient implements EthGatewayClientInterface {
  private readonly logger = new Logger(EthGatewayClient.name);

  constructor(
    @Inject(ETH_GATEWAY_CLIENT_MODULE_OPTIONS)
    private readonly options: EthGatewayClientModuleOptions,
  ) {}

  private baseUrl(): string {
    return (this.options.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '');
  }

  private timeoutMs(): number {
    return this.options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async getSwapEthWithdrawalFee(): Promise<number | null> {
    const url = `${this.baseUrl()}/api/utils/withdrawalfee/SWAP.ETH`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs());
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        this.logger.warn(`Eth gateway fee HTTP ${response.status}`);
        return null;
      }
      const body = (await response.json()) as EthGatewayWithdrawalFeeResponse;
      return typeof body.data === 'number' ? body.data : null;
    } catch (e) {
      this.logger.error((e as Error).message);
      return null;
    }
  }
}
