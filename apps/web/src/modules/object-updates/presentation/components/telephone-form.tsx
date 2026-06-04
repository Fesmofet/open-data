'use client';

import { useEffect } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

export type TelephoneFormProps = {
  value: unknown;
  onChange: (value: unknown) => void;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function TelephoneForm({ value, onChange }: TelephoneFormProps) {
  const { t } = useI18n();
  const obj = asRecord(value);
  const title = typeof obj.title === 'string' ? obj.title : '';
  const phoneValue = typeof obj.value === 'string' ? obj.value : '';

  function patch(next: Record<string, unknown>) {
    onChange({ ...obj, ...next });
  }

  useEffect(() => {
    if (typeof obj.value !== 'string') {
      onChange({
        title: typeof obj.title === 'string' ? obj.title : '',
        value: '',
      });
    }
  }, [obj.title, obj.value, onChange]);

  return (
    <fieldset className="space-y-3 text-body-sm">
      <label className="block">
        <span className="sr-only">{t('name_phone_placeholder')}</span>
        <input
          type="text"
          className="w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg placeholder:text-muted"
          placeholder={t('name_phone_placeholder')}
          value={title}
          onChange={(e) => patch({ title: e.target.value })}
          autoComplete="off"
        />
      </label>
      <label className="block">
        <span className="sr-only">{t('number_phone_placeholder')}</span>
        <input
          type="tel"
          className="w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg placeholder:text-muted"
          placeholder={t('number_phone_placeholder')}
          value={phoneValue}
          onChange={(e) => patch({ value: e.target.value })}
          autoComplete="tel"
        />
      </label>
    </fieldset>
  );
}
