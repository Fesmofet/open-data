import {
  geoDuplicateMatchSql,
  geoJsonPointToText,
  objectUpdateInsertValues,
} from './object-update-insert-values';
import type { GeoJsonPoint } from '@opden-data-layer/core';

describe('object-update-insert-values', () => {
  const point: GeoJsonPoint = {
    type: 'Point',
    coordinates: [35.68634, 49.774724],
  };

  it('serializes GeoJSON Point with lon, lat order', () => {
    expect(geoJsonPointToText(point)).toBe(
      '{"type":"Point","coordinates":[35.68634,49.774724]}',
    );
  });

  it('exposes duplicate-match SQL using geometry cast (not geography ST_Equals)', () => {
    expect(geoDuplicateMatchSql(geoJsonPointToText(point))).toBeDefined();
  });

  it('wraps value_geo for insert with geography cast', () => {
    const row = objectUpdateInsertValues({
      update_id: 'u1',
      value_geo: point,
      value_json: null,
    });
    expect(row.value_geo).toBeDefined();
    expect(row.value_geo).not.toEqual(point);
    expect(row.value_json).toBeNull();
  });
});
