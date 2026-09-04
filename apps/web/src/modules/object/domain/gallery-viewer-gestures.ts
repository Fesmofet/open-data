export const GALLERY_SWIPE_HORIZONTAL_THRESHOLD_PX = 40;
export const GALLERY_SWIPE_VERTICAL_THRESHOLD_PX = 80;
export const GALLERY_SWIPE_AXIS_DOMINANCE_RATIO = 1.2;
export const GALLERY_DOUBLE_TAP_MAX_MS = 300;
export const GALLERY_DOUBLE_TAP_MAX_DISTANCE_PX = 24;
export const GALLERY_VIEWER_DOUBLE_TAP_ZOOM = 2;

export type SwipeAxis = 'horizontal' | 'vertical';

export type Point2D = {
  x: number;
  y: number;
};

export type Size2D = {
  width: number;
  height: number;
};

export function resolveSwipeAxis(dx: number, dy: number): SwipeAxis | null {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx >= GALLERY_SWIPE_HORIZONTAL_THRESHOLD_PX && absDx > absDy * GALLERY_SWIPE_AXIS_DOMINANCE_RATIO) {
    return 'horizontal';
  }

  if (absDy >= GALLERY_SWIPE_VERTICAL_THRESHOLD_PX && absDy > absDx * GALLERY_SWIPE_AXIS_DOMINANCE_RATIO) {
    return 'vertical';
  }

  return null;
}

export function shouldCommitSwipe(axis: SwipeAxis, dx: number, dy: number): boolean {
  return resolveSwipeAxis(dx, dy) === axis;
}

export function clampPan(
  pan: Point2D,
  zoom: number,
  stageSize: Size2D,
): Point2D {
  if (zoom <= 1 || stageSize.width <= 0 || stageSize.height <= 0) {
    return { x: 0, y: 0 };
  }

  const maxX = (stageSize.width * (zoom - 1)) / 2;
  const maxY = (stageSize.height * (zoom - 1)) / 2;

  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

export function panForZoomAtPoint({
  tap,
  stageSize,
  zoom,
}: {
  tap: Point2D;
  stageSize: Size2D;
  zoom: number;
}): Point2D {
  if (zoom <= 1 || stageSize.width <= 0 || stageSize.height <= 0) {
    return { x: 0, y: 0 };
  }

  const center = {
    x: stageSize.width / 2,
    y: stageSize.height / 2,
  };

  return clampPan(
    {
      x: (tap.x - center.x) * (1 - zoom),
      y: (tap.y - center.y) * (1 - zoom),
    },
    zoom,
    stageSize,
  );
}

export function isDoubleTapCandidate(
  previousTap: Point2D & { atMs: number },
  nextTap: Point2D & { atMs: number },
): boolean {
  const elapsedMs = nextTap.atMs - previousTap.atMs;
  if (elapsedMs < 0 || elapsedMs > GALLERY_DOUBLE_TAP_MAX_MS) {
    return false;
  }

  const dx = nextTap.x - previousTap.x;
  const dy = nextTap.y - previousTap.y;
  const distance = Math.hypot(dx, dy);

  return distance <= GALLERY_DOUBLE_TAP_MAX_DISTANCE_PX;
}
