'use client';

import { useCallback, useEffect, useId, useMemo, useState, type SVGProps } from 'react';
import { createPortal } from 'react-dom';

import {
  AppMap,
  AppMarker,
  MAP_EMBED_STACK_CLASS,
  MapFitBounds,
  MapInvalidateSizeOnMount,
  MapProvider,
  type MapPosition,
} from '@/modules/map';
import { HydrationSafeAnchor } from '@/shared/presentation';

import {
  OBJECT_MAP_MODAL_MIN_HEIGHT_PX,
  OBJECT_MAP_PREVIEW_MIN_HEIGHT_PX,
  OBJECT_MAP_PREVIEW_ZOOM,
} from '../constants/object-map-preview';

export type ObjectGeoPreviewProps = {
  latitude: number;
  longitude: number;
  /** Accessible label for the marker / region. */
  label: string;
};

const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

const OBJECT_GEO_ZOOM_UI = {
  position: 'topright' as const,
  compact: true,
};

const MAP_OVERLAY_BUTTON_CLASS =
  'pointer-events-auto flex size-9 cursor-pointer items-center justify-center rounded-btn border border-border bg-surface text-fg shadow-card hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60';

function IconExpandLarge(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <polyline points="15 3 21 3 21 9" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconMinimize(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <polyline points="4 14 10 14 10 20" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
    </svg>
  );
}

function IconMyLocation(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
      {...props}
    >
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}

function OsmCreditLine(props: { className?: string }) {
  const { className } = props;
  return (
    <p className={className ?? 'mt-2 text-center text-caption text-muted'}>
      <HydrationSafeAnchor
        href={OSM_COPYRIGHT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-border underline-offset-2 hover:text-fg"
      >
        © OpenStreetMap contributors
      </HydrationSafeAnchor>
    </p>
  );
}

type MapOverlayControlsProps = {
  onExpand?: () => void;
  onMinimize?: () => void;
  onLocate: () => void;
  locating: boolean;
  locateError: boolean;
};

function MapOverlayControls({
  onExpand,
  onMinimize,
  onLocate,
  locating,
  locateError,
}: MapOverlayControlsProps) {
  return (
    <>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1100]">
        <button
          type="button"
          aria-label="Show my location"
          onClick={onLocate}
          disabled={locating}
          className={MAP_OVERLAY_BUTTON_CLASS}
        >
          <IconMyLocation className="text-fg-secondary" />
        </button>
      </div>

      {onExpand ? (
        <div className="pointer-events-none absolute bottom-3 right-3 z-[1100]">
          <button
            type="button"
            aria-label="Open map fullscreen"
            onClick={onExpand}
            className={MAP_OVERLAY_BUTTON_CLASS}
          >
            <IconExpandLarge className="text-fg-secondary" />
          </button>
        </div>
      ) : null}

      {onMinimize ? (
        <div className="pointer-events-none absolute bottom-3 right-3 z-[1100]">
          <button
            type="button"
            aria-label="Close fullscreen map"
            onClick={onMinimize}
            className={MAP_OVERLAY_BUTTON_CLASS}
          >
            <IconMinimize className="text-fg-secondary" />
          </button>
        </div>
      ) : null}

      {locateError ? (
        <p className="pointer-events-none absolute bottom-14 left-3 z-[1100] rounded-btn border border-border bg-surface px-2 py-1 text-caption text-error shadow-card">
          Location unavailable
        </p>
      ) : null}
    </>
  );
}

type GeoMapMarkersProps = {
  center: MapPosition;
  label: string;
  userLocation: MapPosition | null;
  fitBoundsPositions: readonly MapPosition[] | null;
};

function GeoMapMarkers({
  center,
  label,
  userLocation,
  fitBoundsPositions,
}: GeoMapMarkersProps) {
  return (
    <>
      <AppMarker position={center}>
        <span className="sr-only">{label}</span>
      </AppMarker>
      {userLocation ? (
        <AppMarker position={userLocation} variant="user-location">
          <span className="sr-only">Your location</span>
        </AppMarker>
      ) : null}
      {fitBoundsPositions ? <MapFitBounds positions={fitBoundsPositions} /> : null}
    </>
  );
}

/** Leaflet-backed preview + fullscreen modal; client-only via maps module dynamic import. */
export function ObjectGeoPreview({ latitude, longitude, label }: ObjectGeoPreviewProps) {
  const center = [latitude, longitude] as const;
  const [expanded, setExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<MapPosition | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(false);
  const titleId = useId();

  const fitBoundsPositions = useMemo(
    () => (userLocation ? ([center, userLocation] as const) : null),
    [center, userLocation],
  );

  const handleLocate = useCallback((): void => {
    if (!navigator.geolocation) {
      setLocateError(true);
      return;
    }

    setLocating(true);
    setLocateError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocateError(true);
      },
    );
  }, []);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return (): void => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return (): void => {
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  const modal =
    expanded && typeof document !== 'undefined' ? (
      createPortal(
        <div
          className="fixed inset-0 z-[240] flex flex-col bg-bg"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <span id={titleId} className="sr-only">
            {label}
          </span>
          <div className="flex shrink-0 justify-end border-b border-border px-2 py-2">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Close map"
              className="rounded-btn p-2 text-fg-secondary hover:bg-surface-alt hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <IconClose />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">
            <div className={`${MAP_EMBED_STACK_CLASS} min-h-0 flex-1`}>
              <AppMap
                center={center}
                zoom={OBJECT_MAP_PREVIEW_ZOOM}
                showBuiltInAttribution={false}
                zoomUi={OBJECT_GEO_ZOOM_UI}
                className="size-full rounded-btn border border-border"
                style={{ minHeight: OBJECT_MAP_MODAL_MIN_HEIGHT_PX, width: '100%' }}
              >
                <MapInvalidateSizeOnMount />
                <GeoMapMarkers
                  center={center}
                  label={label}
                  userLocation={userLocation}
                  fitBoundsPositions={fitBoundsPositions}
                />
              </AppMap>

              <MapOverlayControls
                onMinimize={() => setExpanded(false)}
                onLocate={handleLocate}
                locating={locating}
                locateError={locateError}
              />
            </div>
          </div>

          <div className="shrink-0 pb-4 pt-1">
            <OsmCreditLine />
          </div>
        </div>,
        document.body,
      )
    ) : null;

  return (
    <MapProvider>
      <div>
        <div className={MAP_EMBED_STACK_CLASS}>
          <AppMap
            center={center}
            zoom={OBJECT_MAP_PREVIEW_ZOOM}
            showBuiltInAttribution={false}
            zoomUi={OBJECT_GEO_ZOOM_UI}
            className="w-full rounded-btn border border-border"
            style={{ minHeight: OBJECT_MAP_PREVIEW_MIN_HEIGHT_PX, width: '100%' }}
          >
            <GeoMapMarkers
              center={center}
              label={label}
              userLocation={userLocation}
              fitBoundsPositions={fitBoundsPositions}
            />
          </AppMap>

          <MapOverlayControls
            onExpand={() => setExpanded(true)}
            onLocate={handleLocate}
            locating={locating}
            locateError={locateError}
          />
        </div>

        <OsmCreditLine />
        {modal}
      </div>
    </MapProvider>
  );
}
