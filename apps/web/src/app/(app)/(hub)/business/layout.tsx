import type { ReactNode } from 'react';

/** Shared wrapper for `/business/*` routes (sub-nav lives in BusinessPageShell). */
export default function BusinessLayout({ children }: { children: ReactNode }) {
  return children;
}
