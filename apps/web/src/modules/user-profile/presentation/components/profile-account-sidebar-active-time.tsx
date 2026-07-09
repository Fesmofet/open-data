'use client';

import { useEffect, useState } from 'react';

import { formatRelativeFeedTime } from '@/shared/utils/format-relative-time';
import { useI18n } from '@/i18n/providers/i18n-provider';

type ProfileAccountSidebarActiveTimeProps = {
  timestamp: string;
};

export function ProfileAccountSidebarActiveTime({
  timestamp,
}: ProfileAccountSidebarActiveTimeProps) {
  const { locale } = useI18n();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatRelativeFeedTime(timestamp, locale));
  }, [timestamp, locale]);

  return (
    <time dateTime={timestamp} suppressHydrationWarning>
      {label ?? '\u00a0'}
    </time>
  );
}
