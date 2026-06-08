'use client';

import { useEffect } from 'react';

import { useMap } from 'react-leaflet';

import type { MapPosition } from '../types';

const FIT_BOUNDS_PADDING_PX = 48;

export type MapFitBoundsProps = {
  positions: readonly MapPosition[];
};

/**
 * Re-fits the map viewport when `positions` changes (e.g. destination + user location).
 * Requires at least two positions; no-op otherwise.
 */
export function MapFitBounds({ positions }: MapFitBoundsProps): null {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) {
      return;
    }
    const latLngBounds = positions.map(
      ([lat, lng]) => [lat, lng] as [number, number],
    );
    map.fitBounds(latLngBounds, {
      padding: [FIT_BOUNDS_PADDING_PX, FIT_BOUNDS_PADDING_PX],
    });
  }, [map, positions]);

  return null;
}
