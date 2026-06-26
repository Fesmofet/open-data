import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAccessGuard, ViewerMatchesJwtGuard } from '../auth';
import { ZodBodyPipe } from '../pipes';
import {
  GetWaivAdvancedReportEndpoint,
  waivAdvancedReportBodySchema,
  type WaivAdvancedReportBody,
  type WaivAdvancedReportResponse,
} from '../domain/wallet';

@Controller({ path: 'wallet/waiv', version: '1' })
export class WaivWalletAdvancedReportController {
  constructor(
    private readonly getAdvancedReport: GetWaivAdvancedReportEndpoint,
  ) {}

  @Post('advanced-report')
  @UseGuards(JwtAccessGuard, ViewerMatchesJwtGuard)
  async advancedReport(
    @Body(new ZodBodyPipe(waivAdvancedReportBodySchema)) body: WaivAdvancedReportBody,
  ): Promise<WaivAdvancedReportResponse> {
    return this.getAdvancedReport.execute(body);
  }
}
