'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import type { CSSProperties, RefObject } from 'react';

import type { WaivAdvancedReportRowApi } from '../../../../application/dto/waiv-advanced-report-api.schema';
import type { WaivAdvancedReportRowView } from '../../../../application/mappers/build-waiv-advanced-report-row-view';
import { WaivAdvancedReportRow } from './waiv-advanced-report-row';

export const WAIV_ADVANCED_REPORT_ROW_ESTIMATE_HEIGHT_PX = 56;

type WaivAdvancedReportVirtualTbodyProps = {
  wallet: readonly WaivAdvancedReportRowApi[];
  scrollRef: RefObject<HTMLDivElement | null>;
  canToggleExemption: boolean;
  onToggleExemption: (row: WaivAdvancedReportRowView, checked: boolean) => void;
};

export function WaivAdvancedReportVirtualTbody({
  wallet,
  scrollRef,
  canToggleExemption,
  onToggleExemption,
}: WaivAdvancedReportVirtualTbodyProps) {
  const rowVirtualizer = useVirtualizer({
    count: wallet.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => WAIV_ADVANCED_REPORT_ROW_ESTIMATE_HEIGHT_PX,
    overscan: 12,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  if (wallet.length === 0) {
    return null;
  }

  return (
    <div
      role="rowgroup"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: 'relative',
      }}
    >
      {virtualRows.map((virtualRow) => {
        const rowApi = wallet[virtualRow.index];
        if (!rowApi) {
          return null;
        }

        const rowStyle: CSSProperties = {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start}px)`,
        };

        return (
          <WaivAdvancedReportRow
            key={`${rowApi.userName}:${rowApi.operationIndex}`}
            rowApi={rowApi}
            dataIndex={virtualRow.index}
            measureRef={rowVirtualizer.measureElement}
            style={rowStyle}
            canToggleExemption={canToggleExemption}
            onToggleExemption={onToggleExemption}
          />
        );
      })}
    </div>
  );
}
