import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';

/** Grouped categories for the object type selector. */
export const OBJECT_TYPE_GROUPS = [
  {
    id: 'popular',
    types: [
      'business',
      'person',
      'product',
      'page',
      'recipe',
      'restaurant',
      'link',
    ],
  },
  {
    id: 'content',
    types: ['page', 'list', 'link', 'recipe'],
  },
  {
    id: 'social',
    types: ['person', 'group', 'hashtag', 'newsfeed', 'governance'],
  },
  {
    id: 'commerce',
    types: ['product', 'service', 'book', 'dish', 'drink', 'shop'],
  },
  {
    id: 'maps',
    types: ['business', 'restaurant', 'place', 'map'],
  },
  {
    id: 'web',
    types: ['webpage', 'html', 'widget', 'affiliate'],
  },
] as const;

export type ObjectTypeGroupId = (typeof OBJECT_TYPE_GROUPS)[number]['id'];

export type ObjectTypeSelectorGroupId = ObjectTypeGroupId | 'other';

/** i18n keys for section headers in the type picker. */
export const OBJECT_TYPE_GROUP_I18N_KEY: Record<
  ObjectTypeSelectorGroupId,
  string
> = {
  popular: 'object_create_group_popular',
  content: 'object_create_group_content',
  social: 'object_create_group_social',
  commerce: 'object_create_group_commerce',
  maps: 'object_create_group_maps',
  web: 'object_create_group_web',
  other: 'object_create_group_other',
};

/** Short subtitles shown on object type cards (single line). */
export const OBJECT_TYPE_CARD_DESCRIPTION: Record<string, string> = {
  page: 'Markup document',
  list: 'Curated collection of objects',
  link: 'Website reference or review',
  recipe: 'Cooking instructions',
  person: 'Public profile for an individual',
  group: 'Collection of user accounts',
  hashtag: 'Hashtag feed',
  newsfeed: 'Custom feed',
  governance: 'Rules for a managed space or context',
  product: 'Product information',
  service: 'Service offering',
  book: 'Book information',
  dish: 'Food item on a menu',
  drink: 'Beverage item on a menu',
  shop: 'Organized storefront',
  business: 'Company or organization',
  restaurant: 'Food-service business',
  place: 'Point of interest',
  map: 'Organized map',
  webpage: 'Simple web page',
  html: 'Custom HTML page',
  widget: 'External component',
  affiliate: 'Rules for affiliate links',
};

/** Human-readable labels for object type cards (registry only has machine descriptions). */
export const OBJECT_TYPE_DISPLAY_LABEL: Record<string, string> = {
  recipe: 'Recipe',
  place: 'Place',
  person: 'Person',
  product: 'Product',
  page: 'Page',
  business: 'Business',
  restaurant: 'Restaurant',
  book: 'Book',
  dish: 'Dish',
  drink: 'Drink',
  service: 'Service',
  shop: 'Shop',
  list: 'List',
  map: 'Map',
  link: 'Link',
  group: 'Group',
  hashtag: 'Hashtag',
  affiliate: 'Affiliate',
  webpage: 'Webpage',
  widget: 'Widget',
  newsfeed: 'Newsfeed',
  html: 'HTML',
  governance: 'Governance',
};

export function labelForObjectType(objectType: string): string {
  return OBJECT_TYPE_DISPLAY_LABEL[objectType] ?? objectType;
}

/** UI subtitle for a type (card copy, then registry machine description). */
export function descriptionForObjectType(objectType: string): string {
  return (
    OBJECT_TYPE_CARD_DESCRIPTION[objectType] ??
    OBJECT_TYPE_REGISTRY[objectType]?.description ??
    ''
  );
}
