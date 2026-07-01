import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentJwtUser,
  JwtAccessGuard,
  type JwtAccessUser,
} from '../auth';
import { ZodBodyPipe, ZodQueryPipe } from '../pipes';
import {
  waivGeneratedReportCreateBodySchema,
  waivGeneratedReportListQuerySchema,
  waivGeneratedReportRowsQuerySchema,
  waivGeneratedReportToggleRowBodySchema,
  type WaivGeneratedReportCreateBody,
  type WaivGeneratedReportListQuery,
  type WaivGeneratedReportListResponse,
  type WaivGeneratedReportRowsQuery,
  type WaivGeneratedReportRowsResponse,
  type WaivGeneratedReportSummaryDto,
  type WaivGeneratedReportToggleRowBody,
} from '../domain/wallet/schemas/waiv-generated-report.schema';
import { WaivGeneratedReportsService } from '../domain/wallet/waiv-generated-reports.service';

@Controller({ path: 'wallet/waiv/generated-reports', version: '1' })
export class WaivWalletGeneratedReportController {
  constructor(private readonly generatedReports: WaivGeneratedReportsService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  async create(
    @CurrentJwtUser() user: JwtAccessUser,
    @Body(new ZodBodyPipe(waivGeneratedReportCreateBodySchema))
    body: WaivGeneratedReportCreateBody,
  ): Promise<WaivGeneratedReportSummaryDto> {
    return this.generatedReports.createReport(user.sub, body);
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  async list(
    @CurrentJwtUser() user: JwtAccessUser,
    @Query(new ZodQueryPipe(waivGeneratedReportListQuerySchema))
    query: WaivGeneratedReportListQuery,
  ): Promise<WaivGeneratedReportListResponse> {
    return this.generatedReports.listReports(user.sub, query.skip, query.limit);
  }

  @Get(':reportId/rows')
  @UseGuards(JwtAccessGuard)
  async rows(
    @CurrentJwtUser() user: JwtAccessUser,
    @Param('reportId') reportId: string,
    @Query(new ZodQueryPipe(waivGeneratedReportRowsQuerySchema))
    query: WaivGeneratedReportRowsQuery,
  ): Promise<WaivGeneratedReportRowsResponse> {
    return this.generatedReports.listReportRows(
      user.sub,
      reportId,
      query.skip,
      query.limit,
    );
  }

  @Patch(':reportId/rows/:operationIndex')
  @UseGuards(JwtAccessGuard)
  async toggleRow(
    @CurrentJwtUser() user: JwtAccessUser,
    @Param('reportId') reportId: string,
    @Param('operationIndex', ParseIntPipe) operationIndex: number,
    @Body(new ZodBodyPipe(waivGeneratedReportToggleRowBodySchema))
    body: WaivGeneratedReportToggleRowBody,
  ): Promise<WaivGeneratedReportSummaryDto> {
    return this.generatedReports.toggleRowChecked(
      user.sub,
      reportId,
      operationIndex,
      body.checked,
    );
  }

  @Post(':reportId/stop')
  @UseGuards(JwtAccessGuard)
  async stop(
    @CurrentJwtUser() user: JwtAccessUser,
    @Param('reportId') reportId: string,
  ): Promise<WaivGeneratedReportSummaryDto> {
    return this.generatedReports.stopReport(user.sub, reportId);
  }

  @Delete(':reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAccessGuard)
  async remove(
    @CurrentJwtUser() user: JwtAccessUser,
    @Param('reportId') reportId: string,
  ): Promise<void> {
    await this.generatedReports.deleteReport(user.sub, reportId);
  }

  @Get(':reportId')
  @UseGuards(JwtAccessGuard)
  async get(
    @CurrentJwtUser() user: JwtAccessUser,
    @Param('reportId') reportId: string,
  ): Promise<WaivGeneratedReportSummaryDto> {
    return this.generatedReports.getReport(user.sub, reportId);
  }
}
