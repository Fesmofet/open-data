'use client';

import L from 'leaflet';
import { Marker } from 'react-leaflet';

import '../../map-leaflet-markers.css';

import type { AppMarkerProps } from '../../types';

let userLocationIcon: L.DivIcon | undefined;

function getUserLocationIcon(): L.DivIcon {
  if (!userLocationIcon) {
    userLocationIcon = L.divIcon({
      // Keep `leaflet-div-icon` — custom className replaces Leaflet defaults.
      className: 'leaflet-div-icon map-user-location-marker',
      html: '<span class="map-user-location-marker-dot" aria-hidden="true"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }
  return userLocationIcon;
}

export function LeafletAppMarker({
  position,
  children,
  variant = 'default',
}: AppMarkerProps) {
  const latLng: [number, number] = [position[0], position[1]];

  if (variant === 'user-location') {
    return (
      <Marker position={latLng} icon={getUserLocationIcon()} zIndexOffset={1000}>
        {children}
      </Marker>
    );
  }

  return <Marker position={latLng}>{children}</Marker>;
}
