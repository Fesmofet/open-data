'use client';

import type { ReactNode } from 'react';

import {
  CalendarIcon,
  CircleStarIcon,
  ClockIcon,
  DollarIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  ThumbDownIcon,
  ThumbUpIcon,
  ZapIcon,
} from '@/icons';

function SidebarIconShell({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex h-[1lh] w-5 shrink-0 items-center justify-center text-fg-tertiary [&_svg]:block"
      aria-hidden
    >
      {children}
    </span>
  );
}

export function SidebarBrandIcon({ src }: { src: string }) {
  return (
    <SidebarIconShell>
      <img src={src} alt="" className="size-4 object-contain" />
    </SidebarIconShell>
  );
}

export function SidebarLocationIcon() {
  return (
    <SidebarIconShell>
      <MapPinIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarLinkIcon() {
  return (
    <SidebarIconShell>
      <LinkIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarMailIcon() {
  return (
    <SidebarIconShell>
      <MailIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarCalendarIcon() {
  return (
    <SidebarIconShell>
      <CalendarIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarCircleStarIcon() {
  return (
    <SidebarIconShell>
      <CircleStarIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarClockIcon() {
  return (
    <SidebarIconShell>
      <ClockIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarDollarIcon() {
  return (
    <SidebarIconShell>
      <DollarIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarThumbsUpIcon() {
  return (
    <SidebarIconShell>
      <ThumbUpIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarThumbsDownIcon() {
  return (
    <SidebarIconShell>
      <ThumbDownIcon size="md" />
    </SidebarIconShell>
  );
}

export function SidebarFlashIcon() {
  return (
    <SidebarIconShell>
      <ZapIcon size="md" />
    </SidebarIconShell>
  );
}
