import type { GeoJsonPoint } from '@opden-data-layer/core';
import { latLonToGeoJsonPoint } from '@opden-data-layer/core';

function parseCoordinate(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * IPFS payloads may send `value_geo` as a JSON string or GeoJSON Point object.
 */
export function coerceGeoUpdateRawValue(raw: unknown): unknown {
  if (raw === null || raw === undefined) {
    return raw;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return raw;
    }
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

export function normalizeGeoPayloadToLatLon(
  raw: unknown,
): { latitude: number; longitude: number } | null {
  const value = coerceGeoUpdateRawValue(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const o = value as Record<string, unknown>;

  if (o['type'] === 'Point' && Array.isArray(o['coordinates'])) {
    const coords = o['coordinates'] as unknown[];
    const lon = parseCoordinate(coords[0]);
    const lat = parseCoordinate(coords[1]);
    if (lon === null || lat === null) {
      return null;
    }
    return { latitude: lat, longitude: lon };
  }

  const lat = parseCoordinate(o['latitude'] ?? o['lat']);
  const lon = parseCoordinate(o['longitude'] ?? o['lon'] ?? o['lng']);
  if (lat === null || lon === null) {
    return null;
  }
  return { latitude: lat, longitude: lon };
}

export function geoPayloadToGeoJsonPoint(raw: unknown): GeoJsonPoint | null {
  const latLon = normalizeGeoPayloadToLatLon(raw);
  if (!latLon) {
    return null;
  }
  return latLonToGeoJsonPoint(latLon);
}
