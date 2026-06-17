---
id: web-maps
title: Maps
description: Geographic maps need a heavy browser-only SDK. Product UIs should depend on **`AppMap`**, **`AppMarker`**, and **`AppPopup`** plus **`MapProvider`**, not on Leaflet or MapLibre directly. That keeps open the option to move from **Leaflet** (raster tiles, simple stacks) to **MapLibre** (vector tiles, custom layers) without rewriting screens.
type: spec
status: active
scope: web
tags: [web, maps]
updated_at: 2026-06-17
related:
  - docs/apps/web/spec/overview.md
---

# Maps (web)

**Back:** [web overview](overview.md)

## Why this module exists

Geographic maps need a heavy browser-only SDK. Product UIs should depend on **`AppMap`**, **`AppMarker`**, and **`AppPopup`** plus **`MapProvider`**, not on Leaflet or MapLibre directly. That keeps open the option to move from **Leaflet** (raster tiles, simple stacks) to **MapLibre** (vector tiles, custom layers) without rewriting screens.

- **Code:** `apps/web/src/modules/map/`
- **Port:** `MapProviderPort` in `types.ts` — `Map`, `Marker`, `Popup` components sharing `AppMapProps` / `AppMarkerProps` / `AppPopupProps`.

## Default stack

- **Engine:** Leaflet via `react-leaflet` (`leafletMapProvider`).
- **Wrappers:** `AppMap` loads the map with `next/dynamic` and `{ ssr: false }` so Leaflet never runs during SSR.

## Usage

Wrap any subtree that renders maps with **`MapProvider`** (default `impl` is Leaflet). Import UI from the feature barrel:

```tsx
'use client';

import {
  AppMap,
  AppMarker,
  AppPopup,
  MapProvider,
} from '@/modules/map';

export function DemoMap() {
  return (
    <MapProvider>
      <AppMap
        center={[52.52, 13.405] as const}
        zoom={13}
        className="h-96 w-full rounded-md"
      >
        <AppMarker position={[52.52, 13.405] as const}>
          <AppPopup>
            <p className="text-fg p-2 text-sm">Example</p>
          </AppPopup>
        </AppMarker>
      </AppMap>
    </MapProvider>
  );
}
```

Coordinate type is **`MapPosition`**: `readonly [latitude, longitude]`.

Optional **`onMapClick`** on **`AppMap`** (Leaflet): fires with `[latitude, longitude]` when the user clicks the map — used by the object-edit geo picker.

Optional **`onViewportChange`** on **`AppMap`** (Leaflet): fires on mount and after pan/zoom with a legacy-style bbox `{ topPoint: [lng, lat], bottomPoint: [lng, lat] }` — used by profile map reload/list.

### Tile layer (Leaflet)

Optional props on **`AppMap`**:

- `showBuiltInAttribution` — when `false`, Leaflet’s default attribution strip on the map is hidden. If you still use OpenStreetMap tiles, provide **© OpenStreetMap contributors** (with link to the [copyright page](https://www.openstreetmap.org/copyright)) elsewhere near the map to meet the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
- `tileLayerUrl` — URL template (e.g. `{z}/{x}/{y}`). Default is OpenStreetMap raster tiles; comply with their [tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
- `tileAttribution` — HTML attribution string for the tile layer when `showBuiltInAttribution` is not `false`.

### Default marker icons (Leaflet)

The default **`AppMarker`** variant uses the **Waivio orange teardrop pin** (legacy `SimpleMarker.js` SVG via `L.divIcon`, colors `#f87007` / white). Props:

- `highlighted` — larger pin (list hover on profile map)
- `dimmed` — 0.5 fill opacity (non-highlighted pins when another is hovered)

The **`user-location`** variant remains a round accent dot (`map-user-location-marker`).

Implementation: `components/waivio-map-pin.ts`, `providers/leaflet/leaflet-marker.tsx`.

- `onClick` — optional Leaflet marker click handler (profile map highlight)
- `children` — typically `AppPopup` for infowindows

### MapFitBounds

`MapFitBounds` fits the viewport when `positions` has at least two `[lat, lng]` pairs. Re-fits only when the positions key changes (avoids loops). Used by profile map after marker load. Implementation: `components/MapFitBounds.tsx`.

### Popups (Leaflet)

`AppPopup` supports `className`, `maxWidth`, and `minWidth`. Profile map uses `className="map-object-popup"` with styles in `map-leaflet-popup.css` for zero-padding infowindow cards.

### Viewport changes

`LeafletMapViewportHandler` emits `onViewportChange` on mount and after `moveend`/`zoomend`. Callback is ref-stable to avoid effect loops.

## Swapping the engine

1. Implement **`MapProviderPort`** with your SDK (e.g. MapLibre GL + React wrappers).
2. Pass it to **`<MapProvider impl={myProvider} />`**.
3. Keep props on **`AppMap` / `AppMarker` / `AppPopup`** stable; extend shared types in `types.ts` if new cross-engine props are needed.

**`maplibreMapProviderStub`** throws if mounted; it exists only as a naming/import placeholder until a real MapLibre port is added.

## SSR and Next.js

- Do **not** import `leaflet` or `react-leaflet` in **Server Components**.
- **`AppMap`** is already client-only and dynamically loaded without SSR. **`AppMarker`** / **`AppPopup`** must be **descendants** of **`AppMap`** in the React tree so the underlying map context exists after load.
- Importing **`leaflet/dist/leaflet.css`** happens only inside the Leaflet provider on the client.

## Styling

Use **semantic** Tailwind tokens (`border-border`, `bg-surface-alt`, etc.) for chrome around the map. Map library internals (canvas, tile layers) cannot always be themed; keep chrome consistent with [`theme.md`](theme.md).

## Related

- User profile map route: [`pages/user-profile/routes/map.md`](pages/user-profile/routes/map.md)
