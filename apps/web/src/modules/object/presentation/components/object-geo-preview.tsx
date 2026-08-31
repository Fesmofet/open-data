'use client';

import { useCallback, useId, useMemo, useState } from 'react';

import { LocateIcon, MaximizeIcon, MinimizeIcon } from '@/icons';
import {
  AppMap,
  AppMarker,
  MAP_EMBED_STACK_CLASS,
  MapFitBounds,
  MapInvalidateSizeOnMount,
  MapProvider,
  type MapPosition,
} from '@/modules/map';
import { HydrationSafeAnchor, ModalShell, ModalShellCloseButton, MODAL_Z_INDEX_GEO_FULLSCREEN } from '@/shared/presentation';

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
          <LocateIcon size={18} className="text-fg-secondary" />
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
            <MaximizeIcon size={18} className="text-fg-secondary" />
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
            <MinimizeIcon size={18} className="text-fg-secondary" />
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

  const mapModalHeader = (
    <>
      <span id={titleId} className="sr-only">
        {label}
      </span>
      <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-2">
        <ModalShellCloseButton
          onClose={() => setExpanded(false)}
          ariaLabel="Close map"
        />
      </div>
    </>
  );

  const mapModalFooter = (
    <div className="shrink-0 pb-4 pt-1">
      <OsmCreditLine />
    </div>
  );

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
        <ModalShell
          open={expanded}
          onClose={() => setExpanded(false)}
          variant="fullscreen"
          zIndex={MODAL_Z_INDEX_GEO_FULLSCREEN}
          labelledBy={titleId}
          panelClassName="bg-bg"
          scrollBody={false}
          header={mapModalHeader}
          footer={mapModalFooter}
        >
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
        </ModalShell>
      </div>
    </MapProvider>
  );
}
