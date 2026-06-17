'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

import type { MapBoundingBox } from '../../types';

export type LeafletMapViewportHandlerProps = {
  onViewportChange?: (box: MapBoundingBox) => void;
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

export function LeafletMapViewportHandler({
  onViewportChange,
}: LeafletMapViewportHandlerProps): null {
  const map = useMap();
  const onViewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useMapEvents({
    moveend: () => {
      onViewportChangeRef.current?.(boundsToBox(map.getBounds()));
    },
    zoomend: () => {
      onViewportChangeRef.current?.(boundsToBox(map.getBounds()));
    },
  });

  useEffect(() => {
    onViewportChangeRef.current?.(boundsToBox(map.getBounds()));
  }, [map]);

  return null;
}
