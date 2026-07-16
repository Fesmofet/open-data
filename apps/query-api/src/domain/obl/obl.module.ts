import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories';
import { OblOfferDraftsService } from './obl-offer-drafts.service';
import { OblOffersService, OblLedgerService } from './obl-ledger.service';
import { OblConversionService } from './obl-conversion.service';
import { OblRelationshipsService } from './obl-relationships.service';
import { OblArbitrationService } from './obl-arbitration.service';

@Module({
  imports: [RepositoriesModule],
  providers: [
    OblOfferDraftsService,
    OblOffersService,
    OblLedgerService,
    OblConversionService,
    OblRelationshipsService,
    OblArbitrationService,
  ],
  exports: [
    OblOfferDraftsService,
    OblOffersService,
    OblLedgerService,
    OblConversionService,
    OblRelationshipsService,
    OblArbitrationService,
  ],
})
export class OblModule {}
