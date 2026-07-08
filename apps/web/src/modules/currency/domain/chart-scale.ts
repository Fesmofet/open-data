export type ChartScalePoint = {
  x: number;
  y: number;
  label: string;
  value: number;
};

export type ChartScaleInput = {
  points: { label: string; value: number }[];
  width: number;
  height: number;
  padding?: number;
  bottomPadding?: number;
};

const DEFAULT_PADDING = 8;

function withYRangePadding(min: number, max: number): { min: number; max: number } {
  if (min === max) {
    const delta = min === 0 ? 1 : Math.abs(min) * 0.05;

    return { min: min - delta, max: max + delta };
  }

  const span = max - min;
  const pad = span * 0.05;

  return { min: min - pad, max: max + pad };
}

export function scaleChartPoints(input: ChartScaleInput): {
  scaled: ChartScalePoint[];
  polyline: string;
  areaPath: string;
} {
  const padding = input.padding ?? DEFAULT_PADDING;
  const bottomPadding = input.bottomPadding ?? padding;
  const innerWidth = Math.max(input.width - padding * 2, 1);
  const innerHeight = Math.max(input.height - padding - bottomPadding, 1);

  if (input.points.length === 0) {
    return { scaled: [], polyline: '', areaPath: '' };
  }

  const values = input.points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const { min, max } = withYRangePadding(rawMin, rawMax);
  const ySpan = max - min || 1;
  const lastIndex = Math.max(input.points.length - 1, 1);

  const scaled = input.points.map((point, index) => {
    const x = padding + (index / lastIndex) * innerWidth;
    const y =
      padding + innerHeight - ((point.value - min) / ySpan) * innerHeight;

    return {
      x,
      y,
      label: point.label,
      value: point.value,
    };
  });

  const polyline = scaled.map((point) => `${point.x},${point.y}`).join(' ');

  const baselineY = padding + innerHeight;
  const areaPath =
    scaled.length > 0
      ? [
          `M ${scaled[0].x} ${baselineY}`,
          ...scaled.map((point) => `L ${point.x} ${point.y}`),
          `L ${scaled[scaled.length - 1].x} ${baselineY}`,
          'Z',
        ].join(' ')
      : '';

  return { scaled, polyline, areaPath };
}

export function nearestChartPointIndex(
  points: ChartScalePoint[],
  pointerX: number,
): number {
  if (points.length === 0) {
    return -1;
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    const distance = Math.abs(points[index].x - pointerX);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}
