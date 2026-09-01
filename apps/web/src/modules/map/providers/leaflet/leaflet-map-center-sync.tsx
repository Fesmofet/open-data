'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

import type { MapPosition } from '../../types';

function samePosition(a: MapPosition, b: MapPosition): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Pans the map when `center` or `zoom` changes (e.g. coordinate inputs, locate). */
export function LeafletMapCenterSync({
  center,
  zoom,
}: {
  center: MapPosition;
  zoom: number;
}) {
  const map = useMap();
  const prevView = useRef<{ center: MapPosition; zoom: number } | null>(null);

  useEffect(() => {
    const prev = prevView.current;
    if (
      prev &&
      samePosition(prev.center, center) &&
      prev.zoom === zoom
    ) {
      return;
    }
    const animate = prev !== null;
    prevView.current = { center, zoom };
    map.setView([center[0], center[1]], zoom, { animate });
  }, [center, zoom, map]);

  return null;
}
