'use client';

import { useId, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  AppMap,
  AppMarker,
  MAP_EMBED_STACK_CLASS,
  MapInvalidateSizeOnMount,
  MapProvider,
} from '@/modules/map';
import {
  OBJECT_MAP_PREVIEW_MIN_HEIGHT_PX,
  OBJECT_MAP_PREVIEW_ZOOM,
} from '@/modules/object/presentation/constants/object-map-preview';

import type { ObjectUpdateFeedItemView } from '../../application/dto/object-updates-feed.dto';

const TEXT_PREVIEW_MAX_CHARS = 300;

const MAP_ZOOM_UI = {
  position: 'topright' as const,
  compact: true,
};

const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

export type UpdateCardValueProps = Pick<
  ObjectUpdateFeedItemView,
  'value_text' | 'value_geo'
>;

export function UpdateCardValue({ value_text, value_geo }: UpdateCardValueProps) {
  const { t } = useI18n();
  const mapLabelId = useId();
  const [expanded, setExpanded] = useState(false);

  const text = value_text?.trim() ?? '';
  const hasLongText = text.length > TEXT_PREVIEW_MAX_CHARS;
  const shownText =
    !expanded && hasLongText ? `${text.slice(0, TEXT_PREVIEW_MAX_CHARS)}…` : text;

  if (text.length > 0) {
    return (
      <div className="text-body-sm text-fg">
        <p className="whitespace-pre-wrap break-words">{shownText}</p>
        {hasLongText ? (
          <button
            type="button"
            className="mt-2 text-body-sm font-weight-label text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t('object_updates_show_less') : t('object_updates_show_more')}
          </button>
        ) : null}
      </div>
    );
  }

  if (value_geo != null) {
    const center = [value_geo.latitude, value_geo.longitude] as const;
    return (
      <div>
        <p id={mapLabelId} className="sr-only">
          Map
        </p>
        <MapProvider>
          <div
            className={`${MAP_EMBED_STACK_CLASS} rounded-btn border border-border`}
            style={{ minHeight: OBJECT_MAP_PREVIEW_MIN_HEIGHT_PX }}
            aria-labelledby={mapLabelId}
          >
            <AppMap
              center={center}
              zoom={OBJECT_MAP_PREVIEW_ZOOM}
              className="h-full w-full"
              style={{ minHeight: OBJECT_MAP_PREVIEW_MIN_HEIGHT_PX }}
              zoomUi={MAP_ZOOM_UI}
              showBuiltInAttribution={false}
            >
              <MapInvalidateSizeOnMount />
              <AppMarker position={center} />
            </AppMap>
          </div>
        </MapProvider>
        <p className="mt-2 text-center text-caption text-muted">
          <a
            href={OSM_COPYRIGHT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border underline-offset-2 hover:text-fg"
          >
            © OpenStreetMap contributors
          </a>
        </p>
      </div>
    );
  }

  return <p className="text-body-sm text-muted">—</p>;
}
