import { Injectable } from '@nestjs/common';
import type { Kysely, Transaction } from 'kysely';
import type { NewPostObject } from '@opden-data-layer/core';
import {
  buildRelatedImageRows,
  extractPostImageUrls,
} from '@opden-data-layer/core';
import type { Database } from '../../database';
import { PostObjectRelatedImagesRepository } from '../../repositories/post-object-related-images.repository';

type DbExecutor = Kysely<Database> | Transaction<Database>;

@Injectable()
export class PostRelatedImagesSyncService {
  constructor(
    private readonly relatedImagesRepository: PostObjectRelatedImagesRepository,
  ) {}

  async syncForPost(
    author: string,
    permlink: string,
    jsonMetadata: string,
    postObjects: readonly NewPostObject[],
    trx?: DbExecutor,
  ): Promise<void> {
    const imageUrls = extractPostImageUrls(jsonMetadata);
    if (imageUrls.length === 0) {
      await this.relatedImagesRepository.deleteForPost(author, permlink, trx);
      return;
    }

    const rows = buildRelatedImageRows(
      postObjects.map((po) => ({
        object_id: po.object_id,
        object_type: po.object_type ?? null,
      })),
      author,
      permlink,
      imageUrls,
    );
    await this.relatedImagesRepository.replaceForPost(author, permlink, rows, trx);
  }

  async appendForNewBindings(
    author: string,
    permlink: string,
    jsonMetadata: string,
    newObjectRows: readonly NewPostObject[],
    trx?: DbExecutor,
  ): Promise<void> {
    if (newObjectRows.length === 0) {
      return;
    }
    const imageUrls = extractPostImageUrls(jsonMetadata);
    if (imageUrls.length === 0) {
      return;
    }

    const rows = buildRelatedImageRows(
      newObjectRows.map((po) => ({
        object_id: po.object_id,
        object_type: po.object_type ?? null,
      })),
      author,
      permlink,
      imageUrls,
    );
    await this.relatedImagesRepository.insertRows(rows, trx);
  }
}
