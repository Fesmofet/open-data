/**
 * Legacy display order for the left rail mirrors waivio `ObjectInfo`.
 *
 * Default types: menu cluster first (when present), then {@link ABOUT_SECTION_BLOCK_ORDER}.
 * Product-like types (`book`, `product`, `service`): parent/publisher, then
 * {@link NAVIGATE_SECTION_BLOCK_ORDER} (gallery → price → options), then menu, then about.
 *
 * @see tmp/waivio-frontend-legacy/src/client/app/Sidebar/ObjectInfo/ObjectInfo.js
 * (`galleryPriceOptionsSection` before `menuSection`; gallery/price omitted from `aboutSection`.)
 */

/** Object types that use the legacy “navigate” cluster (gallery / price / options) before menu. */
export const OPTIONS_OBJECT_TYPES = ['book', 'product', 'service'] as const;

export type OptionsObjectType = (typeof OPTIONS_OBJECT_TYPES)[number];

export const BOOK_OBJECT_TYPE = 'book' as const;

export function isOptionsObjectType(objectType: string): boolean {
  const normalized = objectType.trim();
  return (OPTIONS_OBJECT_TYPES as readonly string[]).includes(normalized);
}

export function isBookObjectType(objectType: string): boolean {
  return objectType.trim() === BOOK_OBJECT_TYPE;
}

/**
 * Legacy `galleryPriceOptionsSection` order for product-like types.
 * compareAtPrice precedes price; sale follows price; options last in the cluster.
 */
export const NAVIGATE_SECTION_BLOCK_ORDER = [
  'gallery',
  'compareAtPrice',
  'price',
  'saleEvent',
  'options',
] as const;

export type NavigateSectionBlockId = (typeof NAVIGATE_SECTION_BLOCK_ORDER)[number];

const NAVIGATE_BLOCK_IDS = new Set<string>(NAVIGATE_SECTION_BLOCK_ORDER);

/** Name and title blocks precede the about stack (edit mode and view when set). */
export const HEADER_BLOCK_ORDER = ['name', 'title'] as const;

export type HeaderBlockId = (typeof HEADER_BLOCK_ORDER)[number];

/** Main about stack for non-special object types (subset implemented in ODL UI). */
export const ABOUT_SECTION_BLOCK_ORDER = [
  'image',
  'imageBackground',
  'status',
  'parent',
  'author',
  'publisher',
  'description',
  'category',
  'rating',
  'tags',
  'gallery',
  'price',
  'options',
  'compareAtPrice',
  'saleEvent',
  'calories',
  'cookTime',
  'ingredients',
  'nutrition',
  'workHours',
  'address',
  'geo',
  'websites',
  'productWeight',
  'size',
  'merchant',
  'brand',
  'manufacturer',
  'featureList',
  'link',
  'phones',
  'email',
  'walletAddress',
  'identifier',
] as const;

export type AboutSectionBlockId = (typeof ABOUT_SECTION_BLOCK_ORDER)[number];

/**
 * Menu / custom-sort cluster is rendered before the about stack (legacy `menuSection`).
 */
export const MENU_BLOCK_ID = 'menuItems' as const;

/** Legacy menu cluster: CTA buttons immediately after menu rows (not in about stack). */
export const MENU_CLUSTER_BLOCK_ORDER = ['button'] as const;

export type MenuClusterBlockId = (typeof MENU_CLUSTER_BLOCK_ORDER)[number];

/** Full left-rail order in edit mode for generic object types (empty slots when supported). */
export const EDIT_MODE_LEFT_RAIL_BLOCK_ORDER = [
  ...HEADER_BLOCK_ORDER,
  MENU_BLOCK_ID,
  ...MENU_CLUSTER_BLOCK_ORDER,
  ...ABOUT_SECTION_BLOCK_ORDER,
] as const;

export type EditModeLeftRailBlockId = (typeof EDIT_MODE_LEFT_RAIL_BLOCK_ORDER)[number];

/** About-stack blocks for product-like types after the navigate cluster (no duplicate commerce blocks). */
export function optionsTypeAboutRemainderOrder(): readonly AboutSectionBlockId[] {
  const excluded = new Set<AboutSectionBlockId>([
    ...NAVIGATE_SECTION_BLOCK_ORDER,
    'parent',
    'publisher',
    'typicalAgeRange',
    'inLanguage',
    'datePublished',
    'printLength',
  ]);
  const rest = ABOUT_SECTION_BLOCK_ORDER.filter((id) => !excluded.has(id));
  const withoutDescription = rest.filter((id) => id !== 'description');
  return ['description', ...withoutDescription];
}

/** Book about stack: reading age, language, and publication date after website. */
export function bookTypeAboutRemainderOrder(): readonly AboutSectionBlockId[] {
  const base = optionsTypeAboutRemainderOrder();
  const websitesIdx = base.indexOf('websites');
  if (websitesIdx < 0) {
    return [...base, 'typicalAgeRange', 'inLanguage', 'datePublished', 'printLength'];
  }
  return [
    ...base.slice(0, websitesIdx + 1),
    'typicalAgeRange',
    'inLanguage',
    'datePublished',
    'printLength',
    ...base.slice(websitesIdx + 1),
  ];
}

/** Edit-mode slot order; product-like types match legacy navigate-before-menu layout. */
export function resolveEditModeLeftRailBlockOrder(
  objectType: string,
): readonly EditModeLeftRailBlockId[] {
  if (!isOptionsObjectType(objectType)) {
    return EDIT_MODE_LEFT_RAIL_BLOCK_ORDER;
  }

  if (isBookObjectType(objectType)) {
    return [
      ...HEADER_BLOCK_ORDER,
      'parent',
      'publisher',
      ...NAVIGATE_SECTION_BLOCK_ORDER,
      MENU_BLOCK_ID,
      ...MENU_CLUSTER_BLOCK_ORDER,
      ...bookTypeAboutRemainderOrder(),
    ];
  }

  return [
    ...HEADER_BLOCK_ORDER,
    'parent',
    'publisher',
    ...NAVIGATE_SECTION_BLOCK_ORDER,
    MENU_BLOCK_ID,
    ...MENU_CLUSTER_BLOCK_ORDER,
    ...optionsTypeAboutRemainderOrder(),
  ];
}

function isNavigateBlockId(id: AboutSectionBlockId): id is NavigateSectionBlockId {
  return NAVIGATE_BLOCK_IDS.has(id);
}

export { isNavigateBlockId };
