import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories';
import { OblOfferDraftsService } from './obl-offer-drafts.service';
import { OblOffersService, OblLedgerService } from './obl-ledger.service';
import { OblConversionService } from './obl-conversion.service';
import { OblRelationshipsService } from './obl-relationships.service';

@Module({
  imports: [RepositoriesModule],
  providers: [
    OblOfferDraftsService,
    OblOffersService,
    OblLedgerService,
    OblConversionService,
    OblRelationshipsService,
  ],
  exports: [
    OblOfferDraftsService,
    OblOffersService,
    OblLedgerService,
    OblConversionService,
    OblRelationshipsService,
  ],
})
export class OblModule {}
