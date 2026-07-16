import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { JsonValue, OblOfferDraft } from '@opden-data-layer/core';
import { OblOfferDraftsRepository } from '../../repositories/obl.repository';
import type {
  CreateOblOfferDraftBody,
  ListOblOfferDraftsQuery,
  PatchOblOfferDraftBody,
} from './obl.schemas';
import { buildOffsetPage } from './obl-pagination';

export interface OblOfferDraftView {
  draftId: string;
  author: string;
  kind: 'offer' | 'request';
  fields: JsonValue;
  legalText: string | null;
  lastUpdated: number;
}

function asJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

@Injectable()
export class OblOfferDraftsService {
  private readonly logger = new Logger(OblOfferDraftsService.name);

  constructor(private readonly drafts: OblOfferDraftsRepository) {}

  toView(row: OblOfferDraft): OblOfferDraftView {
    return {
      draftId: row.draft_id,
      author: row.author,
      kind: row.kind,
      fields: row.fields,
      legalText: row.legal_text,
      lastUpdated: row.last_updated,
    };
  }

  async getList(author: string, query?: ListOblOfferDraftsQuery) {
    const limit = query?.limit ?? 20;
    const offset = query?.offset ?? 0;
    const rows = await this.drafts.listByAuthorPaginated(author, limit + 1, offset);
    const page = buildOffsetPage(rows, limit);
    return {
      items: page.items.map((row) => this.toView(row)),
      hasMore: page.hasMore,
    };
  }

  async getOne(author: string, draftId: string): Promise<OblOfferDraftView> {
    const row = await this.drafts.findByAuthorAndDraftId(author, draftId);
    if (!row) {
      throw new NotFoundException('OBL offer draft not found');
    }
    return this.toView(row);
  }

  async create(author: string, body: CreateOblOfferDraftBody): Promise<OblOfferDraftView> {
    const draftId = body.draftId ?? randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const row = await this.drafts.insert({
      author,
      draft_id: draftId,
      kind: body.kind,
      fields: asJsonValue(body.fields),
      legal_text: body.legalText ?? null,
      last_updated: now,
    });
    return this.toView(row);
  }

  async patch(
    author: string,
    draftId: string,
    body: PatchOblOfferDraftBody,
  ): Promise<OblOfferDraftView> {
    const existing = await this.drafts.findByAuthorAndDraftId(author, draftId);
    if (!existing) {
      throw new NotFoundException('OBL offer draft not found');
    }
    const now = Math.floor(Date.now() / 1000);
    const updated = await this.drafts.updateByAuthorAndDraftId(author, draftId, {
      ...(body.kind !== undefined ? { kind: body.kind } : {}),
      ...(body.fields !== undefined ? { fields: asJsonValue(body.fields) } : {}),
      ...(body.legalText !== undefined ? { legal_text: body.legalText } : {}),
      last_updated: now,
    });
    if (!updated) {
      this.logger.warn(`OBL draft patch missed row ${author}/${draftId}`);
      throw new NotFoundException('OBL offer draft not found');
    }
    return this.toView(updated);
  }

  async delete(author: string, draftId: string): Promise<void> {
    const ok = await this.drafts.deleteByAuthorAndDraftId(author, draftId);
    if (!ok) {
      throw new NotFoundException('OBL offer draft not found');
    }
  }
}
