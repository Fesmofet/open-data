/** Update the browser URL immediately without waiting for App Router navigation. */
export function pushInstantUrl(href: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.history.pushState(window.history.state, '', href);
}

/** Replace the browser URL immediately without waiting for App Router navigation. */
export function replaceInstantUrl(href: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.history.replaceState(window.history.state, '', href);
}
