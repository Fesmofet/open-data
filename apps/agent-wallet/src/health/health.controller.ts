import { Controller, Get } from '@nestjs/common';

import { WalletStatusService } from '../domain/hive-broadcast.service';

@Controller('health')
export class HealthController {
  constructor(private readonly walletStatus: WalletStatusService) {}

  @Get()
  getHealth(): {
    status: string;
    wallet: ReturnType<WalletStatusService['getStatus']>;
  } {
    return {
      status: 'ok',
      wallet: this.walletStatus.getStatus(),
    };
  }
}
