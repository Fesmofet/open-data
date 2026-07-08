'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { ChartPoint } from '../../domain/currency-market.types';
import {
  nearestChartPointIndex,
  scaleChartPoints,
} from '../../domain/chart-scale';
import { formatChartHoverLabel, formatChartWeekdayLabel } from '../../domain/format-chart-weekday';

const CHART_WIDTH = 280;
const CHART_PLOT_HEIGHT = 88;
const CHART_LABEL_HEIGHT = 22;
const CHART_HEIGHT = CHART_PLOT_HEIGHT + CHART_LABEL_HEIGHT;
const CHART_TOOLTIP_Z_INDEX = 50;

type TooltipPosition = {
  x: number;
  y: number;
};

type LineChartSvgProps = {
  points: ChartPoint[];
  strokeClassName?: string;
  fillClassName?: string;
  formatValue?: (value: number) => string;
};

function defaultFormatValue(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

export function LineChartSvg({
  points,
  strokeClassName = 'text-accent',
  fillClassName = 'text-accent/20',
  formatValue = defaultFormatValue,
}: LineChartSvgProps) {
  const { locale } = useI18n();
  const gradientId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [dashOffset, setDashOffset] = useState<number | null>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const { scaled, polyline, areaPath } = useMemo(
    () =>
      scaleChartPoints({
        points,
        width: CHART_WIDTH,
        height: CHART_PLOT_HEIGHT,
        padding: 8,
        bottomPadding: 4,
      }),
    [points],
  );

  const linePath = useMemo(() => {
    if (scaled.length === 0) {
      return '';
    }

    return scaled
      .map((point, index) =>
        index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
      )
      .join(' ');
  }, [scaled]);

  useEffect(() => {
    const path = pathRef.current;

    if (!path) {
      return;
    }

    const length = path.getTotalLength();
    setPathLength(length);
    setDashOffset(length);
    const frame = requestAnimationFrame(() => {
      setDashOffset(0);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [linePath]);

  const activeIndex = hoverIndex >= 0 ? hoverIndex : -1;
  const activePoint = activeIndex >= 0 ? scaled[activeIndex] : null;

  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current) {
      setTooltipPosition(null);
      return;
    }

    const point = scaled[activeIndex];

    if (!point) {
      setTooltipPosition(null);
      return;
    }

    const updateTooltipPosition = () => {
      const bounds = containerRef.current?.getBoundingClientRect();

      if (!bounds) {
        setTooltipPosition(null);
        return;
      }

      setTooltipPosition({
        x: bounds.left + (point.x / CHART_WIDTH) * bounds.width,
        y: bounds.top + (point.y / CHART_HEIGHT) * bounds.height,
      });
    };

    updateTooltipPosition();
    window.addEventListener('scroll', updateTooltipPosition, true);
    window.addEventListener('resize', updateTooltipPosition);

    return () => {
      window.removeEventListener('scroll', updateTooltipPosition, true);
      window.removeEventListener('resize', updateTooltipPosition);
    };
  }, [activeIndex, scaled]);

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;

    setHoverIndex(nearestChartPointIndex(scaled, relativeX));
  };

  const handlePointerLeave = () => {
    setHoverIndex(-1);
    setTooltipPosition(null);
  };

  const tooltip =
    activePoint && tooltipPosition && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none max-w-[12rem] rounded-btn border border-border bg-surface px-2 py-1 text-caption text-fg shadow-card"
            style={{
              position: 'fixed',
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, calc(-100% - 8px))',
              zIndex: CHART_TOOLTIP_Z_INDEX,
            }}
          >
            {activePoint.label ? (
              <div className="text-muted">
                {formatChartHoverLabel(activePoint.label, locale) ||
                  formatChartWeekdayLabel(activePoint.label, locale) ||
                  activePoint.label}
              </div>
            ) : null}
            <div className="font-weight-strong">{formatValue(activePoint.value)}</div>
          </div>,
          document.body,
        )
      : null;

  if (points.length === 0) {
    return (
      <div className="flex h-[110px] items-center justify-center text-caption text-muted">
        —
      </div>
    );
  }

  const labelY = CHART_PLOT_HEIGHT + 16;

  return (
    <div ref={containerRef} className="relative z-0 min-w-0 overflow-visible">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="block h-auto w-full max-w-full touch-none"
        role="img"
        aria-hidden
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className={fillClassName} stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" className={fillClassName} stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {areaPath ? (
          <path d={areaPath} fill={`url(#${gradientId})`} className={fillClassName} />
        ) : null}

        <polyline
          points={polyline}
          fill="none"
          className={strokeClassName}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.25"
        />

        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          className={strokeClassName}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={pathLength > 0 ? pathLength : undefined}
          strokeDashoffset={dashOffset ?? pathLength}
          style={
            pathLength > 0
              ? {
                  transition: 'stroke-dashoffset 0.35s ease-out',
                }
              : undefined
          }
        />

        {scaled.map((point, index) => (
          <circle
            key={`${point.label}-${index}`}
            cx={point.x}
            cy={point.y}
            r={index === activeIndex ? 4 : 3}
            className={strokeClassName}
            fill="currentColor"
            stroke="var(--color-surface)"
            strokeWidth="1.5"
          />
        ))}

        {scaled.map((point, index) => (
          <text
            key={`label-${point.label}-${index}`}
            x={point.x}
            y={labelY}
            textAnchor="middle"
            fill="var(--color-muted)"
            fontSize="10"
            fontWeight="600"
          >
            {formatChartWeekdayLabel(point.label, locale)}
          </text>
        ))}
      </svg>

      {tooltip}
    </div>
  );
}
