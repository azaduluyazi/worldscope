import { useRef, useCallback, useEffect } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

const SWIPE_THRESHOLD = 50; // minimum pixels to trigger swipe
const SWIPE_TIME_LIMIT = 300; // max ms for gesture

/**
 * Touch swipe gesture hook for mobile panel navigation.
 * Returns a ref to attach to the swipeable container.
 */
export function useSwipeGesture<T extends HTMLElement>(handlers: SwipeHandlers) {
  const ref = useRef<T>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      const dt = Date.now() - startTime.current;

      if (dt > SWIPE_TIME_LIMIT) return;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Horizontal swipe
      if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
        if (dx > 0) handlers.onSwipeRight?.();
        else handlers.onSwipeLeft?.();
        return;
      }

      // Vertical swipe
      if (absDy > absDx && absDy > SWIPE_THRESHOLD) {
        if (dy > 0) handlers.onSwipeDown?.();
        else handlers.onSwipeUp?.();
      }
    },
    [handlers]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchEnd]);

  return ref;
}
