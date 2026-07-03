import type { ProjectedObject } from '../object-projection/projected-object.types';

export type ExpertiseProjectedObject = ProjectedObject & {
  user_weight: number;
};

export type PaginatedExpertiseObjects = {
  items: ExpertiseProjectedObject[];
  total: number;
  hasMore: boolean;
};
