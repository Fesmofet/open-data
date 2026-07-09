'use client';

import type { LocaleId } from '@/i18n/types';

export function formatSidebarUsd(value: number, locale: LocaleId): string {
  const abs = Math.abs(value);
  const fractionDigits = abs >= 0.01 ? 2 : abs >= 0.0001 ? 4 : 6;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatManaPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatWebsiteLabel(website: string): { href: string; label: string } {
  let href = website.trim();
  if (!href) {
    return { href: '', label: '' };
  }
  if (!href.startsWith('http://') && !href.startsWith('https://')) {
    href = `http://${href}`;
  }
  try {
    const url = new URL(href);
    let host = url.host;
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    const path = url.pathname.replace(/\/$/, '');
    return { href, label: `${host}${path}` };
  } catch {
    return { href, label: href };
  }
}

export function truncateEmail(email: string, maxLength = 21): string {
  if (email.length <= maxLength) {
    return email;
  }
  return `${email.slice(0, maxLength - 3)}...`;
}
