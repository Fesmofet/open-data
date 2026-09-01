export type DiscoverBox = {
  swLng: number;
  swLat: number;
  neLng: number;
  neLat: number;
};

/** Camera-only map view persisted in the URL (`map=lat,lng,zoom`). Not sent to query-api. */
export type DiscoverMapView = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export type DiscoverUrlParams = {
  type?: string;
  users?: boolean;
  q?: string;
  tags?: string[];
  sort?: 'newest' | 'oldest' | 'rank';
  box?: DiscoverBox | null;
  map?: DiscoverMapView | null;
};

export type DiscoverPageState = {
  usersMode: boolean;
  objectType: string | null;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
  box: DiscoverBox | null;
  map: DiscoverMapView | null;
};

/** URL value for mixed object-type discover results. */
export const DISCOVER_ALL_OBJECT_TYPES = 'all';

type DiscoverSearchParamsSource =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

function readSearchParam(source: DiscoverSearchParamsSource, key: string): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }
  const value = source[key];
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function readSearchParamAll(source: DiscoverSearchParamsSource, key: string): string[] {
  if (source instanceof URLSearchParams) {
    return source.getAll(key);
  }
  const value = source[key];
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

/** Parse `box=swLng,swLat,neLng,neLat` from a URL query value. */
export function parseDiscoverBoxParam(raw: string | null | undefined): DiscoverBox | null {
  if (raw == null) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parts = trimmed.split(',');
  if (parts.length !== 4) {
    return null;
  }
  const swLng = Number(parts[0]);
  const swLat = Number(parts[1]);
  const neLng = Number(parts[2]);
  const neLat = Number(parts[3]);
  if (
    !isValidLongitude(swLng) ||
    !isValidLatitude(swLat) ||
    !isValidLongitude(neLng) ||
    !isValidLatitude(neLat)
  ) {
    return null;
  }
  if (swLat > neLat) {
    return null;
  }
  return { swLng, swLat, neLng, neLat };
}

/** Serialize a discover map box for URL/API query params. */
export function formatDiscoverBoxParam(box: DiscoverBox): string {
  return `${box.swLng},${box.swLat},${box.neLng},${box.neLat}`;
}

const DISCOVER_MAP_MIN_ZOOM = 0;
const DISCOVER_MAP_MAX_ZOOM = 19;

/** Parse `map=lat,lng,zoom` from a URL query value (camera only; not sent to query-api). */
export function parseDiscoverMapParam(raw: string | null | undefined): DiscoverMapView | null {
  if (raw == null) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parts = trimmed.split(',');
  if (parts.length !== 3) {
    return null;
  }
  const latitude = Number(parts[0]);
  const longitude = Number(parts[1]);
  const zoom = Number(parts[2]);
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null;
  }
  if (!Number.isInteger(zoom) || zoom < DISCOVER_MAP_MIN_ZOOM || zoom > DISCOVER_MAP_MAX_ZOOM) {
    return null;
  }
  return { latitude, longitude, zoom };
}

/** Serialize a discover map camera for URL query params. */
export function formatDiscoverMapParam(map: DiscoverMapView): string {
  return `${map.latitude},${map.longitude},${map.zoom}`;
}

/** Parse `/discover` query state from RSC `searchParams` or client `URLSearchParams`. */
export function parseDiscoverPageState(source: DiscoverSearchParamsSource): DiscoverPageState {
  const usersMode = readSearchParam(source, 'users') === '1';
  const typeRaw = readSearchParam(source, 'type')?.trim();
  const objectType = usersMode ? null : (typeRaw && typeRaw.length > 0 ? typeRaw : null);
  const q = readSearchParam(source, 'q')?.trim() ?? '';
  const tagsRaw = readSearchParamAll(source, 'tags');
  const tags = parseDiscoverTagsParam(
    tagsRaw.length > 0 ? tagsRaw : (readSearchParam(source, 'tags') ?? undefined),
  );
  const sortRaw = readSearchParam(source, 'sort');
  const sort =
    sortRaw === 'oldest' || sortRaw === 'rank' || sortRaw === 'newest' ? sortRaw : 'rank';
  const box = parseDiscoverBoxParam(readSearchParam(source, 'box'));
  const map = parseDiscoverMapParam(readSearchParam(source, 'map'));

  return { usersMode, objectType, q, tags, sort, box, map };
}

/** Encodes tag filter for URL/API: `category:value` (split on first `:`). */
export function encodeTagFilter(category: string, value: string): string {
  return `${category}:${value}`;
}

/** Decodes `category:value` from URL query param; returns null if malformed. */
export function decodeTagFilter(encoded: string): { category: string; value: string } | null {
  const idx = encoded.indexOf(':');
  if (idx < 1) {
    return null;
  }
  const category = encoded.slice(0, idx);
  const value = encoded.slice(idx + 1);
  if (value.length === 0) {
    return null;
  }
  return { category, value };
}

export function buildDiscoverHref(params: DiscoverUrlParams): string {
  const sp = new URLSearchParams();
  if (params.users) {
    sp.set('users', '1');
  } else if (params.type?.trim()) {
    sp.set('type', params.type.trim());
  }
  const q = params.q?.trim();
  if (q) {
    sp.set('q', q);
  }
  for (const tag of params.tags ?? []) {
    const t = tag.trim();
    if (t) {
      sp.append('tags', t);
    }
  }
  if (params.sort && params.sort !== 'rank') {
    sp.set('sort', params.sort);
  }
  if (params.box) {
    sp.set('box', formatDiscoverBoxParam(params.box));
  }
  if (params.map) {
    sp.set('map', formatDiscoverMapParam(params.map));
  }
  const qs = sp.toString();
  return qs.length > 0 ? `/discover?${qs}` : '/discover';
}

export function parseDiscoverTagsParam(raw: string | string[] | undefined): string[] {
  if (raw == null) {
    return [];
  }
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((s) => s.trim()).filter((s) => s.length > 0);
}
