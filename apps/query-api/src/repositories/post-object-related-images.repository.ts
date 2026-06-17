import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database } from '../database';
import { KYSELY } from '../database';

export type RelatedAlbumImageRow = {
  image_url: string;
  author: string;
  permlink: string;
};

@Injectable()
export class PostObjectRelatedImagesRepository {
  private readonly logger = new Logger(PostObjectRelatedImagesRepository.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  private baseQuery(objectId: string, excludedPostKeys: readonly string[]) {
    let q = this.db
      .selectFrom('post_object_related_images')
      .where('object_id', '=', objectId);
    if (excludedPostKeys.length > 0) {
      q = q.where(
        sql<boolean>`CONCAT(author, '_', permlink) NOT IN (${sql.join(
          excludedPostKeys.map((k) => sql.lit(k)),
        )})`,
      );
    }
    return q;
  }

  async countByObjectId(
    objectId: string,
    excludedPostKeys: readonly string[] = [],
  ): Promise<number> {
    try {
      const row = await this.baseQuery(objectId, excludedPostKeys)
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirst();
      return Number(row?.count ?? 0);
    } catch (e) {
      this.logger.error((e as Error).message);
      return 0;
    }
  }

  async findPreview(
    objectId: string,
    limit: number,
    excludedPostKeys: readonly string[] = [],
  ): Promise<RelatedAlbumImageRow[]> {
    try {
      return await this.baseQuery(objectId, excludedPostKeys)
        .select(['image_url', 'author', 'permlink'])
        .orderBy('author')
        .orderBy('permlink')
        .orderBy('sort_ord')
        .limit(limit)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }

  async findPage(
    objectId: string,
    limit: number,
    skip: number,
    excludedPostKeys: readonly string[] = [],
  ): Promise<RelatedAlbumImageRow[]> {
    try {
      return await this.baseQuery(objectId, excludedPostKeys)
        .select(['image_url', 'author', 'permlink'])
        .orderBy('author')
        .orderBy('permlink')
        .orderBy('sort_ord')
        .offset(skip)
        .limit(limit)
        .execute();
    } catch (e) {
      this.logger.error((e as Error).message);
      return [];
    }
  }
}
