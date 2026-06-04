import { sql, type RawBuilder } from 'kysely';
import type { GeoJsonPoint } from '@opden-data-layer/core';

/** GeoJSON Point text for PostGIS (same as migrate-mongo-to-pg `geoJsonPointText`). */
export function geoJsonPointToText(point: GeoJsonPoint): string {
  return JSON.stringify(point);
}

/** Binds `value_geo` as GEOGRAPHY(Point, 4326) — raw JS objects break PostGIS parse. */
export function geographyFromGeoJsonPoint(point: GeoJsonPoint): RawBuilder<unknown> {
  return sql`ST_GeomFromGeoJSON(${geoJsonPointToText(point)}::text)::geography`;
}

/**
 * PostGIS has no `ST_Equals(geography, geography)` — compare as GEOMETRY (see query-api feed).
 */
export function geoDuplicateMatchSql(geoText: string): RawBuilder<boolean> {
  return sql<boolean>`ST_Equals(
    value_geo::geometry,
    ST_GeomFromGeoJSON(${geoText}::text)::geography::geometry
  )`;
}

/**
 * node-postgres sends JS strings as raw SQL text, not JSON-encoded strings.
 * `value_geo` must use ST_GeomFromGeoJSON (see migrate-mongo-to-pg objects flush).
 */
export function objectUpdateInsertValues<T extends Record<string, unknown>>(row: T): T {
  const valueJson = row['value_json'];
  const valueGeo = row['value_geo'];

  return {
    ...row,
    value_json:
      valueJson !== null && valueJson !== undefined
        ? sql`${JSON.stringify(valueJson)}::jsonb`
        : null,
    value_geo:
      valueGeo !== null && valueGeo !== undefined
        ? geographyFromGeoJsonPoint(valueGeo as GeoJsonPoint)
        : null,
  };
}
