import type { MapPosition } from '@/modules/map';

/** Max markers on the discover map (must not exceed query-api DISCOVER_OBJECTS_MAX_LIMIT). */
export const DISCOVER_MAP_MARKERS_LIMIT = 50;

export const DISCOVER_MAP_VIEWPORT_DEBOUNCE_MS = 300;

export const DISCOVER_MAP_DEFAULT_CENTER: MapPosition = [20, 0];
export const DISCOVER_MAP_DEFAULT_ZOOM = 2;

export const DISCOVER_MAP_RAIL_HEIGHT_CLASS = 'h-48';

/** Zoom when centering on the viewer's geolocation (neighbourhood context). */
export const DISCOVER_MAP_LOCATE_ZOOM = 14;
