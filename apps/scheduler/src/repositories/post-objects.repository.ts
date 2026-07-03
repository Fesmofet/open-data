import { Inject, Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import { KYSELY, type Database } from '../database';

export type PostObjectShareRow = {
  object_id: string;
  percent: number | null;
};

@Injectable()
export class PostObjectsRepository {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async findSharesByPost(
    author: string,
    permlink: string,
  ): Promise<PostObjectShareRow[]> {
    return this.db
      .selectFrom('post_objects')
      .select(['object_id', 'percent'])
      .where('author', '=', author)
      .where('permlink', '=', permlink)
      .execute();
  }
}
