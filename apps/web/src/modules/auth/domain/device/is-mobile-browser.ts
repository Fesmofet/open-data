const MOBILE_UA_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  if (MOBILE_UA_PATTERN.test(ua)) {
    return true;
  }

  if (typeof window.matchMedia !== 'function') {
    return false;
  }

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const narrowViewport = window.matchMedia('(max-width: 768px)').matches;
  return coarsePointer && narrowViewport;
}
