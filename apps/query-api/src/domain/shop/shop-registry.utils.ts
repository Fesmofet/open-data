import { getTagCategoryOrderForObjectType } from '../discover/discover-registry.utils';

/** Registry tag category order merged across shop object types (deduped, stable). */
export function getTagCategoryOrderForShopTypes(types: readonly string[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const objectType of types) {
    for (const category of getTagCategoryOrderForObjectType(objectType)) {
      if (!seen.has(category)) {
        seen.add(category);
        order.push(category);
      }
    }
  }
  return order;
}
