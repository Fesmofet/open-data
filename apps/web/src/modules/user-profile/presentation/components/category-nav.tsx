import { getCategoryNav } from '../../infrastructure/clients/categories.client';
import { apiNavContextFromLineage } from './category-nav-path';
import { CategoryNavPanel } from './category-nav-panel';

export type CategoryNavProps = {
  accountName: string;
  types: readonly string[];
  /** Public profile path prefix, e.g. `/@alice/user-shop` */
  basePath: string;
  sectionKey: 'user-shop' | 'recipe';
  /** Decoded category segments from the URL (full lineage for this view). */
  lineageSegments: string[];
};

export async function CategoryNav({
  accountName,
  types,
  basePath,
  sectionKey,
  lineageSegments,
}: CategoryNavProps) {
  const { parentName, path } = apiNavContextFromLineage(lineageSegments);

  const data = await getCategoryNav(accountName, types, {
    name: parentName,
    path,
  });

  return (
    <CategoryNavPanel
      data={data}
      basePath={basePath}
      sectionKey={sectionKey}
      lineageSegments={lineageSegments}
    />
  );
}
