'use client';

import type { ReactNode } from 'react';

function SidebarIconShell({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex w-5 shrink-0 items-center justify-center text-fg"
      aria-hidden
    >
      {children}
    </span>
  );
}

export function SidebarLocationIcon() {
  return (
    <SidebarIconShell>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    </SidebarIconShell>
  );
}

export function SidebarLinkIcon() {
  return (
    <SidebarIconShell>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
        <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
      </svg>
    </SidebarIconShell>
  );
}

export function SidebarMailIcon() {
  return (
    <SidebarIconShell>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    </SidebarIconShell>
  );
}

export function SidebarCalendarIcon() {
  return (
    <SidebarIconShell>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    </SidebarIconShell>
  );
}

export function SidebarHashtagIcon() {
  return (
    <SidebarIconShell>
      <span className="text-body font-weight-label leading-none">#</span>
    </SidebarIconShell>
  );
}

export function SidebarClockIcon() {
  return (
    <SidebarIconShell>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    </SidebarIconShell>
  );
}

export function SidebarDollarIcon() {
  return (
    <SidebarIconShell>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 6.5C17 4.5 14.8 3 12 3S7 4.5 7 6.5 9.5 10 12 10s5 1.5 5 3.5S14.8 17 12 17s-5-1.5-5-3.5" />
      </svg>
    </SidebarIconShell>
  );
}

export function SidebarThumbsUpIcon() {
  return (
    <SidebarIconShell>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    </SidebarIconShell>
  );
}

export function SidebarThumbsDownIcon() {
  return (
    <SidebarIconShell>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rotate-180"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    </SidebarIconShell>
  );
}

export function SidebarFlashIcon() {
  return (
    <SidebarIconShell>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" />
      </svg>
    </SidebarIconShell>
  );
}
