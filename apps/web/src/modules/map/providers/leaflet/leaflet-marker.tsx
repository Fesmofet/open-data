'use client';

import L from 'leaflet';
import { Marker } from 'react-leaflet';

import '../../map-leaflet-markers.css';
import '../../map-waivio-pin.css';

import {
  WAIVIO_MAP_PIN_SIZE,
  waivioMapPinSvgHtml,
} from '../../components/waivio-map-pin';
import type { AppMarkerProps } from '../../types';

let userLocationIcon: L.DivIcon | undefined;

function getUserLocationIcon(): L.DivIcon {
  if (!userLocationIcon) {
    userLocationIcon = L.divIcon({
      className: 'leaflet-div-icon map-user-location-marker',
      html: '<span class="map-user-location-marker-dot" aria-hidden="true"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }
  return userLocationIcon;
}

function getWaivioPinIcon(highlighted: boolean, dimmed: boolean): L.DivIcon {
  const width = highlighted ? WAIVIO_MAP_PIN_SIZE.highlightedWidth : WAIVIO_MAP_PIN_SIZE.width;
  const height = highlighted ? WAIVIO_MAP_PIN_SIZE.highlightedHeight : WAIVIO_MAP_PIN_SIZE.height;
  return L.divIcon({
    className: 'leaflet-div-icon map-waivio-pin-icon',
    html: waivioMapPinSvgHtml({ width, height, dimmed }),
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });
}

export function LeafletAppMarker({
  position,
  children,
  variant = 'default',
  highlighted = false,
  dimmed = false,
  onClick,
}: AppMarkerProps) {
  const latLng: [number, number] = [position[0], position[1]];
  const eventHandlers = onClick ? { click: onClick } : undefined;

  if (variant === 'user-location') {
    return (
      <Marker
        position={latLng}
        icon={getUserLocationIcon()}
        zIndexOffset={1000}
        eventHandlers={eventHandlers}
      >
        {children}
      </Marker>
    );
  }

  return (
    <Marker
      position={latLng}
      icon={getWaivioPinIcon(highlighted, dimmed)}
      zIndexOffset={highlighted ? 500 : 0}
      eventHandlers={eventHandlers}
    >
      {children}
    </Marker>
  );
}
