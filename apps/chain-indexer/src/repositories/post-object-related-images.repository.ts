import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely, Transaction } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';
import { NewPostObjectRelatedImage } from '@opden-data-layer/odl-db-types';

type DbExecutor = Kysely<Database> | Transaction<Database>;

@Injectable()
export class PostObjectRelatedImagesRepository {
  private readonly logger = new Logger(PostObjectRelatedImagesRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  private executor(trx?: DbExecutor): DbExecutor {
    return trx ?? this.db;
  }

  async deleteForPost(
    author: string,
    permlink: string,
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      await this.executor(trx)
        .deleteFrom('post_object_related_images')
        .where('author', '=', author)
        .where('permlink', '=', permlink)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async replaceForPost(
    author: string,
    permlink: string,
    rows: NewPostObjectRelatedImage[],
    trx?: DbExecutor,
  ): Promise<void> {
    try {
      const exec = this.executor(trx);
      await exec
        .deleteFrom('post_object_related_images')
        .where('author', '=', author)
        .where('permlink', '=', permlink)
        .execute();
      if (rows.length === 0) {
        return;
      }
      await exec
        .insertInto('post_object_related_images')
        .values(rows)
        .onConflict((oc) =>
          oc
            .columns(['object_id', 'author', 'permlink', 'image_url'])
            .doNothing(),
        )
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }

  async insertRows(
    rows: NewPostObjectRelatedImage[],
    trx?: DbExecutor,
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    try {
      await this.executor(trx)
        .insertInto('post_object_related_images')
        .values(rows)
        .onConflict((oc) =>
          oc
            .columns(['object_id', 'author', 'permlink', 'image_url'])
            .doNothing(),
        )
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      throw e;
    }
  }
}
