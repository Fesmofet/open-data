import type { ProjectedObject } from '../object-projection/projected-object.types';

export type ProjectedObjectWithCounts = ProjectedObject & {
  followers_count: number;
  experts_count: number;
  /** Linked Hive posts for Reviews (`post_objects`). */
  posts_count: number;
  updates_count: number;
  favorited_by_count: number;
  supervised_count: number;
  exclusive_count: number;
  is_following: boolean;
  viewer_bell: boolean;
  update_type_counts: Record<string, number>;
  /** Distinct non-null locales from object_updates rows for this object. */
  update_locales: string[];
};
