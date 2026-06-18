'use client';

import { useEffect, useState } from 'react';

import { formatRelativeFeedTime } from '@/shared/utils/format-relative-time';
import { useI18n } from '@/i18n/providers/i18n-provider';

type ActivityTimestampProps = {
  timestamp: string;
  className?: string;
};

export function ActivityTimestamp({ timestamp, className }: ActivityTimestampProps) {
  const { locale } = useI18n();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatRelativeFeedTime(timestamp, locale));
  }, [timestamp, locale]);

  return (
    <time dateTime={timestamp} className={className} suppressHydrationWarning>
      {label ?? '\u00a0'}
    </time>
  );
}
