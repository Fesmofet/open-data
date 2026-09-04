import {
  clampPan,
  GALLERY_SWIPE_HORIZONTAL_THRESHOLD_PX,
  GALLERY_SWIPE_VERTICAL_THRESHOLD_PX,
  isDoubleTapCandidate,
  panForZoomAtPoint,
  resolveSwipeAxis,
  shouldCommitSwipe,
} from './gallery-viewer-gestures';

describe('gallery-viewer-gestures', () => {
  describe('resolveSwipeAxis', () => {
    it('returns horizontal when dx dominates and exceeds threshold', () => {
      expect(resolveSwipeAxis(-80, 10)).toBe('horizontal');
      expect(resolveSwipeAxis(80, 10)).toBe('horizontal');
    });

    it('returns vertical when dy dominates and exceeds threshold', () => {
      expect(resolveSwipeAxis(10, 100)).toBe('vertical');
      expect(resolveSwipeAxis(10, -100)).toBe('vertical');
    });

    it('returns null when movement is below threshold or ambiguous', () => {
      expect(resolveSwipeAxis(20, 5)).toBeNull();
      expect(resolveSwipeAxis(50, 45)).toBeNull();
    });
  });

  describe('shouldCommitSwipe', () => {
    it('matches resolved axis', () => {
      expect(
        shouldCommitSwipe('horizontal', -GALLERY_SWIPE_HORIZONTAL_THRESHOLD_PX, 0),
      ).toBe(true);
      expect(
        shouldCommitSwipe('vertical', 0, GALLERY_SWIPE_VERTICAL_THRESHOLD_PX),
      ).toBe(true);
      expect(shouldCommitSwipe('horizontal', 0, GALLERY_SWIPE_VERTICAL_THRESHOLD_PX)).toBe(
        false,
      );
    });
  });

  describe('clampPan', () => {
    it('returns zero pan at 1x zoom', () => {
      expect(clampPan({ x: 100, y: 100 }, 1, { width: 400, height: 300 })).toEqual({
        x: 0,
        y: 0,
      });
    });

    it('clamps pan to stage bounds at higher zoom', () => {
      const stageSize = { width: 400, height: 200 };
      const zoom = 2;

      expect(clampPan({ x: 500, y: -500 }, zoom, stageSize)).toEqual({
        x: 200,
        y: -100,
      });
    });
  });

  describe('panForZoomAtPoint', () => {
    it('centers tap point under finger when zooming in', () => {
      const stageSize = { width: 400, height: 400 };
      const zoom = 2;

      expect(
        panForZoomAtPoint({
          tap: { x: 300, y: 200 },
          stageSize,
          zoom,
        }),
      ).toEqual({
        x: -100,
        y: expect.closeTo(0),
      });
    });

    it('returns zero pan when zoom is 1x', () => {
      expect(
        panForZoomAtPoint({
          tap: { x: 300, y: 200 },
          stageSize: { width: 400, height: 400 },
          zoom: 1,
        }),
      ).toEqual({ x: 0, y: 0 });
    });
  });

  describe('isDoubleTapCandidate', () => {
    it('accepts taps within time and distance limits', () => {
      expect(
        isDoubleTapCandidate(
          { x: 100, y: 100, atMs: 1000 },
          { x: 110, y: 105, atMs: 1200 },
        ),
      ).toBe(true);
    });

    it('rejects taps that are too far apart in time or space', () => {
      expect(
        isDoubleTapCandidate(
          { x: 100, y: 100, atMs: 1000 },
          { x: 100, y: 100, atMs: 1500 },
        ),
      ).toBe(false);
      expect(
        isDoubleTapCandidate(
          { x: 100, y: 100, atMs: 1000 },
          { x: 150, y: 100, atMs: 1100 },
        ),
      ).toBe(false);
    });
  });
});
