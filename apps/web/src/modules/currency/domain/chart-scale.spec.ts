import {
  nearestChartPointIndex,
  scaleChartPoints,
} from './chart-scale';

describe('scaleChartPoints', () => {
  it('maps values into svg coordinates', () => {
    const { scaled, polyline } = scaleChartPoints({
      points: [
        { label: 'a', value: 1 },
        { label: 'b', value: 3 },
        { label: 'c', value: 2 },
      ],
      width: 100,
      height: 50,
      padding: 0,
    });

    expect(scaled).toHaveLength(3);
    expect(scaled[0].y).toBeGreaterThan(scaled[1].y);
    expect(polyline).toMatch(/^0,/);
    expect(polyline).toContain('100,');
  });

  it('handles a single point without crashing', () => {
    const { scaled } = scaleChartPoints({
      points: [{ label: 'only', value: 10 }],
      width: 100,
      height: 50,
    });

    expect(scaled).toHaveLength(1);
    expect(Number.isFinite(scaled[0].x)).toBe(true);
    expect(Number.isFinite(scaled[0].y)).toBe(true);
  });

  it('handles equal values with padded range', () => {
    const { scaled } = scaleChartPoints({
      points: [
        { label: 'a', value: 5 },
        { label: 'b', value: 5 },
      ],
      width: 100,
      height: 50,
      padding: 0,
    });

    expect(scaled[0].y).toBe(scaled[1].y);
    expect(Number.isFinite(scaled[0].y)).toBe(true);
  });
});

describe('nearestChartPointIndex', () => {
  it('returns the closest x coordinate', () => {
    const points = [
      { x: 0, y: 0, label: 'a', value: 1 },
      { x: 50, y: 0, label: 'b', value: 2 },
      { x: 100, y: 0, label: 'c', value: 3 },
    ];

    expect(nearestChartPointIndex(points, 48)).toBe(1);
    expect(nearestChartPointIndex(points, 95)).toBe(2);
  });
});
