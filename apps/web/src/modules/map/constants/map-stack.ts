/**
 * Leaflet default pane z-index tops out around the popup pane (~700).
 * @see https://leafletjs.com/reference.html#map-pane
 */
export const LEAFLET_DEFAULT_MAX_Z_INDEX = 700;

/** Modal scrim/content above embedded Leaflet maps elsewhere on the page. */
export const Z_INDEX_MODAL_ABOVE_MAP = 1_100;

/** Search/typeahead dropdowns portaled above {@link Z_INDEX_MODAL_ABOVE_MAP}. */
export const Z_INDEX_DROPDOWN_ABOVE_MODAL = 1_200;

/**
 * Tailwind classes: contain Leaflet panes inside feed/card embeds so they do not
 * paint over fixed modals that use {@link Z_INDEX_MODAL_ABOVE_MAP}.
 */
export const MAP_EMBED_STACK_CLASS =
  'relative isolate z-0 overflow-hidden' as const;
