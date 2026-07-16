import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthorOwnsAccountGuard,
  JwtAccessGuard,
  normalizeHiveAccount,
} from '../auth';
import {
  OblOfferDraftsService,
  createOblOfferDraftBodySchema,
  type CreateOblOfferDraftBody,
  mutateOblOfferDraftQuerySchema,
  type MutateOblOfferDraftQuery,
  patchOblOfferDraftBodySchema,
  type PatchOblOfferDraftBody,
  type OblOfferDraftView,
} from '../domain/obl';
import { ZodBodyPipe } from '../pipes/zod-body.pipe';
import { ZodQueryPipe } from '../pipes/zod-query.pipe';

@Controller({ path: 'users/:author/obl-drafts', version: '1' })
@UseGuards(JwtAccessGuard, AuthorOwnsAccountGuard)
export class OblOfferDraftsController {
  constructor(private readonly drafts: OblOfferDraftsService) {}

  @Get()
  async list(@Param('author') authorParam: string): Promise<OblOfferDraftView[]> {
    const author = normalizeHiveAccount(authorParam);
    return this.drafts.getList(author);
  }

  @Get('one')
  async getOne(
    @Param('author') authorParam: string,
    @Query(new ZodQueryPipe(mutateOblOfferDraftQuerySchema)) query: MutateOblOfferDraftQuery,
  ): Promise<OblOfferDraftView> {
    const author = normalizeHiveAccount(authorParam);
    return this.drafts.getOne(author, query.draftId);
  }

  @Post()
  async create(
    @Param('author') authorParam: string,
    @Body(new ZodBodyPipe(createOblOfferDraftBodySchema)) body: CreateOblOfferDraftBody,
  ): Promise<OblOfferDraftView> {
    const author = normalizeHiveAccount(authorParam);
    return this.drafts.create(author, body);
  }

  @Patch()
  async patch(
    @Param('author') authorParam: string,
    @Query(new ZodQueryPipe(mutateOblOfferDraftQuerySchema)) query: MutateOblOfferDraftQuery,
    @Body(new ZodBodyPipe(patchOblOfferDraftBodySchema)) body: PatchOblOfferDraftBody,
  ): Promise<OblOfferDraftView> {
    const author = normalizeHiveAccount(authorParam);
    return this.drafts.patch(author, query.draftId, body);
  }

  @Put()
  async put(
    @Param('author') authorParam: string,
    @Query(new ZodQueryPipe(mutateOblOfferDraftQuerySchema)) query: MutateOblOfferDraftQuery,
    @Body(new ZodBodyPipe(patchOblOfferDraftBodySchema)) body: PatchOblOfferDraftBody,
  ): Promise<OblOfferDraftView> {
    const author = normalizeHiveAccount(authorParam);
    return this.drafts.patch(author, query.draftId, body);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('author') authorParam: string,
    @Query(new ZodQueryPipe(mutateOblOfferDraftQuerySchema)) query: MutateOblOfferDraftQuery,
  ): Promise<void> {
    const author = normalizeHiveAccount(authorParam);
    return this.drafts.delete(author, query.draftId);
  }
}
