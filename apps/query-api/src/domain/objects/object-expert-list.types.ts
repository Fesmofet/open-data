/**
 * Paginated expert account row for an object (`user_object_expertise` per object).
 */
export interface ObjectExpertListItem {
  name: string;
  avatarUrl: string | null;
  objectExpertiseWeight: number;
  usersFollowingCount: number;
  isCurrentFollowing: boolean;
}

export interface PaginatedObjectExpertList {
  items: ObjectExpertListItem[];
  total: number;
  hasMore: boolean;
}
