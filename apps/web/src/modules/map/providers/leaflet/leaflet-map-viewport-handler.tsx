'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

import type { MapBoundingBox, MapViewChange } from '../../types';

export type LeafletMapViewportHandlerProps = {
  onViewportChange?: (box: MapBoundingBox) => void;
  onViewChange?: (view: MapViewChange) => void;
};

function boundsToBox(bounds: {
  getNorthEast(): { lng: number; lat: number };
  getSouthWest(): { lng: number; lat: number };
}): MapBoundingBox {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    topPoint: [ne.lng, ne.lat],
    bottomPoint: [sw.lng, sw.lat],
  };
}

function emitViewport(
  map: ReturnType<typeof useMap>,
  onViewportChange?: (box: MapBoundingBox) => void,
  onViewChange?: (view: MapViewChange) => void,
): void {
  const bounds = map.getBounds();
  const box = boundsToBox(bounds);
  onViewportChange?.(box);
  if (onViewChange) {
    const center = map.getCenter();
    onViewChange({
      center: [center.lat, center.lng],
      zoom: map.getZoom(),
      box,
    });
  }
}

export function LeafletMapViewportHandler({
  onViewportChange,
  onViewChange,
}: LeafletMapViewportHandlerProps): null {
  const map = useMap();
  const onViewportChangeRef = useRef(onViewportChange);
  const onViewChangeRef = useRef(onViewChange);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  useMapEvents({
    moveend: () => {
      emitViewport(map, onViewportChangeRef.current, onViewChangeRef.current);
    },
    zoomend: () => {
      emitViewport(map, onViewportChangeRef.current, onViewChangeRef.current);
    },
  });

  useEffect(() => {
    emitViewport(map, onViewportChangeRef.current, onViewChangeRef.current);
  }, [map]);

  return null;
}
