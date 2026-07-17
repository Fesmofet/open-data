import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import {
  OblConversionService,
  OblLedgerService,
  OblOffersService,
  OblRelationshipsService,
  OblArbitrationService,
  listOblRelationshipsQuerySchema,
  listOblArbitrationQuerySchema,
  oblAccountQuerySchema,
  oblLedgerListQuerySchema,
  pairBalanceQuerySchema,
  searchOblOffersQuerySchema,
  usdToWaivQuerySchema,
  type ListOblRelationshipsQuery,
  type ListOblArbitrationQuery,
  type OblLedgerListQuery,
  type PairBalanceQuery,
  type SearchOblOffersQuery,
  type UsdToWaivQuery,
} from '../domain/obl';
import { ZodQueryPipe } from '../pipes/zod-query.pipe';

@Controller({ path: 'obl', version: '1' })
export class OblController {
  constructor(
    private readonly offers: OblOffersService,
    private readonly ledger: OblLedgerService,
    private readonly conversion: OblConversionService,
    private readonly relationships: OblRelationshipsService,
    private readonly arbitration: OblArbitrationService,
  ) {}

  @Get('offers/search')
  async searchOffers(
    @Query(new ZodQueryPipe(searchOblOffersQuerySchema)) query: SearchOblOffersQuery,
  ) {
    return this.offers.search(query);
  }

  @Get('offers/:offerId')
  async getOffer(
    @Param('offerId') offerId: string,
    @Query('version') versionRaw?: string,
  ) {
    const version =
      versionRaw !== undefined && versionRaw !== ''
        ? Number.parseInt(versionRaw, 10)
        : undefined;
    const offer = await this.offers.getOffer(
      offerId,
      Number.isFinite(version) ? version : undefined,
    );
    if (!offer) {
      throw new NotFoundException('OBL offer not found');
    }
    return offer;
  }

  @Get('ledger/payments')
  async listLedgerPayments(
    @Query(new ZodQueryPipe(oblLedgerListQuerySchema)) query: OblLedgerListQuery,
  ) {
    return this.ledger.listPayments(query);
  }

  @Get('ledger/invoices')
  async listLedgerInvoices(
    @Query(new ZodQueryPipe(oblLedgerListQuerySchema)) query: OblLedgerListQuery,
  ) {
    return this.ledger.listInvoices(query);
  }

  @Get('ledger/contracts')
  async listLedgerContracts(
    @Query(new ZodQueryPipe(oblLedgerListQuerySchema)) query: OblLedgerListQuery,
  ) {
    return this.ledger.listContracts(query);
  }

  @Get('ledger/disputes')
  async listLedgerDisputes(
    @Query(new ZodQueryPipe(oblLedgerListQuerySchema)) query: OblLedgerListQuery,
  ) {
    return this.ledger.listDisputes(query);
  }

  @Get('ledger')
  async getLedger(
    @Query(new ZodQueryPipe(pairBalanceQuerySchema)) query: PairBalanceQuery,
  ) {
    return this.ledger.getLedger(query.accountA, query.accountB);
  }

  @Get('balance')
  async getBalance(
    @Query(new ZodQueryPipe(pairBalanceQuerySchema)) query: PairBalanceQuery,
  ) {
    const data = await this.ledger.getLedger(query.accountA, query.accountB);
    return data.balance;
  }

  @Get('convert/usd-to-waiv')
  async usdToWaiv(
    @Query(new ZodQueryPipe(usdToWaivQuerySchema)) query: UsdToWaivQuery,
  ) {
    return this.conversion.usdToWaiv(query);
  }

  @Get('relationships')
  async listRelationships(
    @Query(new ZodQueryPipe(listOblRelationshipsQuerySchema))
    query: ListOblRelationshipsQuery,
  ) {
    return this.relationships.listForAccount(query.account, query);
  }

  @Get('arbitration')
  async listArbitration(
    @Query(new ZodQueryPipe(listOblArbitrationQuerySchema))
    query: ListOblArbitrationQuery,
  ) {
    return this.arbitration.listForAccount(query.account, query);
  }

  @Get('contracts/:contractId')
  async getContract(@Param('contractId') contractId: string) {
    return this.relationships.getContract(contractId);
  }

  @Get('invoices/:invoiceId')
  async getInvoice(@Param('invoiceId') invoiceId: string) {
    return this.relationships.getInvoice(invoiceId);
  }

  @Get('disputes/:disputeId')
  async getDispute(@Param('disputeId') disputeId: string) {
    return this.relationships.getDispute(disputeId);
  }
}
