'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import {
  clampPan,
  GALLERY_VIEWER_DOUBLE_TAP_ZOOM,
  isDoubleTapCandidate,
  panForZoomAtPoint,
  resolveSwipeAxis,
  shouldCommitSwipe,
  type Point2D,
  type Size2D,
  type SwipeAxis,
} from '../../domain/gallery-viewer-gestures';

export type UseGalleryViewerGesturesOptions = {
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: Point2D;
  setPan: (pan: Point2D) => void;
  onGoNext: () => void;
  onGoPrev: () => void;
  onClose: () => void;
  /** Double-tap zoom and drag-to-pan while zoomed. Swipe nav/close still work when false. */
  zoomGesturesEnabled: boolean;
  canNavigate: boolean;
};

export type UseGalleryViewerGesturesResult = {
  stageRef: React.RefObject<HTMLDivElement | null>;
  transformStyle: {
    transform: string;
    opacity: number;
    transition: string;
  };
  pointerHandlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onDoubleClick: (event: ReactPointerEvent<HTMLDivElement>) => void;
  };
};

function readStageSize(stage: HTMLDivElement | null): Size2D {
  if (!stage) {
    return { width: 0, height: 0 };
  }

  const rect = stage.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

function readLocalPoint(event: ReactPointerEvent<HTMLDivElement>): Point2D {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function capturePointer(event: ReactPointerEvent<HTMLDivElement>): void {
  if (typeof event.currentTarget.setPointerCapture !== 'function') {
    return;
  }

  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // Some browsers reject capture for detached or unsupported pointer ids.
  }
}

function releasePointer(event: ReactPointerEvent<HTMLDivElement>): void {
  if (typeof event.currentTarget.hasPointerCapture !== 'function') {
    return;
  }

  try {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  } catch {
    // Ignore release failures when capture was never established.
  }
}

export function useGalleryViewerGestures({
  zoom,
  setZoom,
  pan,
  setPan,
  onGoNext,
  onGoPrev,
  onClose,
  zoomGesturesEnabled,
  canNavigate,
}: UseGalleryViewerGesturesOptions): UseGalleryViewerGesturesResult {
  const stageRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerStartRef = useRef<Point2D | null>(null);
  const lockedAxisRef = useRef<SwipeAxis | null>(null);
  const dragOffsetRef = useRef<Point2D>({ x: 0, y: 0 });
  const lastTapRef = useRef<(Point2D & { atMs: number }) | null>(null);
  const suppressClickRef = useRef(false);
  const panStartRef = useRef<Point2D>({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  const [dragOffset, setDragOffset] = useState<Point2D>({ x: 0, y: 0 });
  const [isPointerActive, setIsPointerActive] = useState(false);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const resetDrag = useCallback(() => {
    dragOffsetRef.current = { x: 0, y: 0 };
    setDragOffset({ x: 0, y: 0 });
    pointerStartRef.current = null;
    lockedAxisRef.current = null;
    activePointerIdRef.current = null;
    setIsPointerActive(false);
  }, []);

  const toggleZoomAtPoint = useCallback(
    (tap: Point2D) => {
      const stageSize = readStageSize(stageRef.current);
      const currentZoom = zoomRef.current;

      if (currentZoom > 1) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      const nextZoom = GALLERY_VIEWER_DOUBLE_TAP_ZOOM;
      setZoom(nextZoom);
      setPan(panForZoomAtPoint({ tap, stageSize, zoom: nextZoom }));
    },
    [setPan, setZoom],
  );

  const handleDoubleTap = useCallback(
    (tap: Point2D) => {
      if (!zoomGesturesEnabled) {
        return;
      }
      toggleZoomAtPoint(tap);
    },
    [toggleZoomAtPoint, zoomGesturesEnabled],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      if (activePointerIdRef.current != null) {
        return;
      }

      activePointerIdRef.current = event.pointerId;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      lockedAxisRef.current = null;
      dragOffsetRef.current = { x: 0, y: 0 };
      setDragOffset({ x: 0, y: 0 });
      panStartRef.current = { ...panRef.current };
      setIsPointerActive(true);
      capturePointer(event);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        activePointerIdRef.current !== event.pointerId ||
        !pointerStartRef.current
      ) {
        return;
      }

      const dx = event.clientX - pointerStartRef.current.x;
      const dy = event.clientY - pointerStartRef.current.y;

      if (zoomRef.current > 1 && zoomGesturesEnabled) {
        const stageSize = readStageSize(stageRef.current);
        const nextPan = clampPan(
          {
            x: panStartRef.current.x + dx,
            y: panStartRef.current.y + dy,
          },
          zoomRef.current,
          stageSize,
        );
        setPan(nextPan);
        return;
      }

      if (!lockedAxisRef.current) {
        lockedAxisRef.current = resolveSwipeAxis(dx, dy);
      }

      if (lockedAxisRef.current === 'horizontal') {
        dragOffsetRef.current = { x: dx, y: 0 };
        setDragOffset({ x: dx, y: 0 });
        return;
      }

      if (lockedAxisRef.current === 'vertical' && dy > 0) {
        dragOffsetRef.current = { x: 0, y: dy };
        setDragOffset({ x: 0, y: dy });
      }
    },
    [setPan, zoomGesturesEnabled],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        activePointerIdRef.current !== event.pointerId ||
        !pointerStartRef.current
      ) {
        return;
      }

      const dx = event.clientX - pointerStartRef.current.x;
      const dy = event.clientY - pointerStartRef.current.y;
      const localPoint = readLocalPoint(event);
      const nowMs = Date.now();

      releasePointer(event);

      if (zoomRef.current <= 1) {
        const axis = lockedAxisRef.current ?? resolveSwipeAxis(dx, dy);

        if (axis === 'horizontal' && canNavigate && shouldCommitSwipe('horizontal', dx, dy)) {
          suppressClickRef.current = true;
          if (typeof window !== 'undefined') {
            window.setTimeout(() => {
              suppressClickRef.current = false;
            }, 400);
          }
          if (dx < 0) {
            onGoNext();
          } else {
            onGoPrev();
          }
        } else if (axis === 'vertical' && shouldCommitSwipe('vertical', dx, dy) && dy > 0) {
          suppressClickRef.current = true;
          onClose();
        } else if (
          Math.abs(dx) <= 8 &&
          Math.abs(dy) <= 8 &&
          lastTapRef.current &&
          isDoubleTapCandidate(lastTapRef.current, { ...localPoint, atMs: nowMs })
        ) {
          handleDoubleTap(localPoint);
          lastTapRef.current = null;
        } else {
          lastTapRef.current = { ...localPoint, atMs: nowMs };
        }
      }

      resetDrag();
    },
    [canNavigate, handleDoubleTap, onClose, onGoNext, onGoPrev, resetDrag],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      releasePointer(event);

      resetDrag();
    },
    [resetDrag],
  );

  const onDoubleClick = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!zoomGesturesEnabled || suppressClickRef.current) {
        return;
      }

      event.preventDefault();
      handleDoubleTap(readLocalPoint(event));
      lastTapRef.current = null;
    },
    [handleDoubleTap, zoomGesturesEnabled],
  );

  const totalPanX = pan.x + dragOffset.x;
  const totalPanY = pan.y + dragOffset.y;
  const dismissOpacity =
    zoom <= 1 && dragOffset.y > 0
      ? Math.max(0.35, 1 - dragOffset.y / 240)
      : 1;

  return {
    stageRef,
    transformStyle: {
      transform: `translate3d(${totalPanX}px, ${totalPanY}px, 0) scale(${zoom})`,
      opacity: dismissOpacity,
      transition: isPointerActive ? 'none' : 'transform 0.15s ease, opacity 0.15s ease',
    },
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onDoubleClick,
    },
  };
}
