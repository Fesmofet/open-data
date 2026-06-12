/** Above app header dropdowns (z-60) and feed overlays; below map fullscreen modals. */
export const MODAL_Z_INDEX_DEFAULT = 110;

/** Modals that must paint above embedded Leaflet maps on the same page. */
export const MODAL_Z_INDEX_ABOVE_MAP = 1_100;

/** Full-screen object gallery viewer. */
export const MODAL_Z_INDEX_GALLERY = 150;

/** Full-screen geo map expand overlay. */
export const MODAL_Z_INDEX_GEO_FULLSCREEN = 240;

/** @deprecated Use {@link MODAL_Z_INDEX_DEFAULT}. */
export const APP_MODAL_Z_INDEX = MODAL_Z_INDEX_DEFAULT;
