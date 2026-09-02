'use client';

import AirDatepicker from 'air-datepicker';
import { useEffect, useRef } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { LocaleId } from '@/i18n/types';

import { loadAirDatepickerLocale } from './resolve-air-datepicker-locale';

import 'air-datepicker/air-datepicker.css';

export type ActivityOriginalDatePickerProps = {
  onSelect: (unix: number) => void;
  /** Restore a previously chosen stamp when reopening the picker. */
  initialUnix?: number | null;
};

/**
 * Inline date+time picker for object Activity original publish stamp.
 */
export function ActivityOriginalDatePicker({
  onSelect,
  initialUnix = null,
}: ActivityOriginalDatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale } = useI18n();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const initialUnixOnMountRef = useRef(initialUnix);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return undefined;
    }

    let cancelled = false;
    let dp: InstanceType<typeof AirDatepicker> | null = null;
    let bootstrapping = true;

    void (async () => {
      const dpLocale = await loadAirDatepickerLocale(locale as LocaleId);
      if (cancelled || !containerRef.current) {
        return;
      }

      const maxDate = new Date(Date.now() + 86_400 * 1000);

      const instance = new AirDatepicker(containerRef.current, {
        inline: true,
        timepicker: true,
        autoClose: false,
        toggleSelected: false,
        locale: dpLocale,
        maxDate,
        onSelect: ({ date, datepicker }) => {
          if (bootstrapping || datepicker.selectedDates.length === 0) {
            return;
          }
          const selected = Array.isArray(date) ? date[0] : date;
          if (selected instanceof Date && !Number.isNaN(selected.getTime())) {
            onSelectRef.current(Math.trunc(selected.getTime() / 1000));
          }
        },
      });
      dp = instance;

      const seedUnix =
        initialUnixOnMountRef.current != null && initialUnixOnMountRef.current > 0
          ? initialUnixOnMountRef.current
          : Math.trunc(Date.now() / 1000);
      instance.selectDate(new Date(seedUnix * 1000));
      bootstrapping = false;
    })();

    return () => {
      cancelled = true;
      bootstrapping = true;
      dp?.destroy();
    };
  }, [locale]);

  return (
    <div
      ref={containerRef}
      className={[
        'activity-original-date-picker',
        '[&_.air-datepicker]:border-0 [&_.air-datepicker]:bg-surface [&_.air-datepicker]:shadow-none',
        '[&_.air-datepicker-body]:text-fg [&_.air-datepicker-nav]:text-fg',
        '[&_.air-datepicker-time--row_input[type=range]]:pointer-events-auto',
        '[&_.air-datepicker-time--row_input[type=range]]:touch-none',
      ].join(' ')}
    />
  );
}
