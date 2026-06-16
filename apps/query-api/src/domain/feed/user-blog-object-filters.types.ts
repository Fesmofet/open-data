export interface UserBlogObjectFilterItemDto {
  object_id: string;
  name: string;
  count: number;
}

export interface UserBlogObjectFiltersResponseDto {
  items: UserBlogObjectFilterItemDto[];
}
