'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import type { CSSProperties, RefObject } from 'react';

import type { AdvancedReportRowApi } from '../../../../application/dto/hive-advanced-report-api.schema';
import type { AdvancedReportRowView } from '../../../../application/mappers/build-advanced-report-row-view';
import { HiveAdvancedReportRow } from './hive-advanced-report-row';

export const ADVANCED_REPORT_ROW_ESTIMATE_HEIGHT_PX = 56;

type HiveAdvancedReportVirtualTbodyProps = {
  wallet: readonly AdvancedReportRowApi[];
  scrollRef: RefObject<HTMLDivElement | null>;
  canToggleExemption: boolean;
  onToggleExemption: (row: AdvancedReportRowView, checked: boolean) => void;
};

export function HiveAdvancedReportVirtualTbody({
  wallet,
  scrollRef,
  canToggleExemption,
  onToggleExemption,
}: HiveAdvancedReportVirtualTbodyProps) {
  const rowVirtualizer = useVirtualizer({
    count: wallet.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ADVANCED_REPORT_ROW_ESTIMATE_HEIGHT_PX,
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
          <HiveAdvancedReportRow
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
