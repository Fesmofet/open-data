'use client';

import { Popup } from 'react-leaflet';

import '../../map-leaflet-popup.css';

import type { AppPopupProps } from '../../types';

export function LeafletAppPopup({
  children,
  className,
  maxWidth = 320,
  minWidth = 260,
}: AppPopupProps) {
  return (
    <Popup className={className} maxWidth={maxWidth} minWidth={minWidth}>
      {children}
    </Popup>
  );
}
