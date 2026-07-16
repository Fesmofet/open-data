export type OblOffsetPage<T> = {
  items: T[];
  hasMore: boolean;
};

export type OblCursorPage<T> = {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
};

export const OBL_LIST_PAGE_SIZE = 20;
