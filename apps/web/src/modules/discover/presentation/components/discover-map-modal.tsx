'use client';

import { useId } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  ModalShell,
  ModalShellCloseButton,
  MODAL_Z_INDEX_GEO_FULLSCREEN,
} from '@/shared/presentation';

import type { DiscoverBox, DiscoverMapView } from '../../domain/discover-url';
import { DiscoverMapPanel } from './discover-map-panel';

export type DiscoverMapModalProps = {
  open: boolean;
  onClose: () => void;
  objectType: string;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
  box: DiscoverBox | null;
  mapView: DiscoverMapView | null;
  onApplyArea: (box: DiscoverBox) => void;
  onViewChange?: (view: DiscoverMapView) => void;
};

export function DiscoverMapModal({
  open,
  onClose,
  objectType,
  q,
  tags,
  sort,
  box,
  mapView,
  onApplyArea,
  onViewChange,
}: DiscoverMapModalProps) {
  const { t } = useI18n();
  const titleId = useId();

  const header = (
    <>
      <span id={titleId} className="sr-only">
        {t('discover_map')}
      </span>
      <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-2">
        <ModalShellCloseButton onClose={onClose} ariaLabel={t('discover_map')} />
      </div>
    </>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="fullscreen"
      zIndex={MODAL_Z_INDEX_GEO_FULLSCREEN}
      scrollBody={false}
      labelledBy={titleId}
      panelClassName="bg-bg"
      header={header}
    >
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">
        <DiscoverMapPanel
          variant="fullscreen"
          objectType={objectType}
          q={q}
          tags={tags}
          sort={sort}
          box={box}
          mapView={mapView}
          onApplyArea={(nextBox) => {
            onApplyArea(nextBox);
            onClose();
          }}
          onViewChange={onViewChange}
          onMinimize={onClose}
        />
      </div>
    </ModalShell>
  );
}
