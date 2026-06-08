'use client';

import { Fragment, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { telephoneHref } from '@/modules/object-updates/application/telephone-display.utils';
import { HydrationSafeAnchor } from '@/shared/presentation';

import type { ProjectedTelephoneEntry } from '../../infrastructure/object-projected-fields';

const LEFT_RAIL_PHONES_VISIBLE_COUNT = 3;

function PhoneHandsetIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path
        d="M3.2 1.6h2.4c.44 0 .82.3.92.73l.52 2.08a1 1 0 0 1-.24.95l-1.02 1.02a8.2 8.2 0 0 0 3.64 3.64l1.02-1.02a1 1 0 0 1 .95-.24l2.08.52c.43.1.73.48.73.92v2.4c0 .55-.45 1-1 1C6.74 14.4 1.6 9.26 1.6 2.6c0-.55.45-1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TelephoneLink({ number }: { number: string }) {
  return (
    <HydrationSafeAnchor
      href={telephoneHref(number)}
      className="font-weight-label text-accent tabular-nums hover:underline focus-visible:rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {number}
    </HydrationSafeAnchor>
  );
}

function TelephoneLinksInline({
  entries,
  className,
}: {
  entries: readonly ProjectedTelephoneEntry[];
  className?: string;
}) {
  return (
    <p className={className}>
      {entries.map((entry, index) => (
        <Fragment key={`${entry.value}-${index}`}>
          {index > 0 ? <span aria-hidden> </span> : null}
          <TelephoneLink number={entry.value} />
        </Fragment>
      ))}
    </p>
  );
}

function ShowMoreToggle({
  canExpand,
  expanded,
  onToggle,
}: {
  canExpand: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  if (!canExpand) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-2 text-body-sm font-weight-label text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {expanded ? t('object_updates_show_less') : t('object_right_show_more')}
    </button>
  );
}

export type LeftRailTelephoneRowProps = {
  number: string;
};

/** Single row without title: icon + orange `tel:` link. */
export function LeftRailTelephoneRow({ number }: LeftRailTelephoneRowProps) {
  const trimmed = number.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <PhoneHandsetIcon className="shrink-0 text-muted" />
      <TelephoneLink number={trimmed} />
    </div>
  );
}

function TitledTelephoneEntry({ entry }: { entry: ProjectedTelephoneEntry }) {
  return (
    <div>
      {entry.title ? (
        <div className="flex items-center gap-2">
          <PhoneHandsetIcon className="shrink-0 text-muted" />
          <span className="text-body-sm font-weight-label text-fg">{entry.title}</span>
        </div>
      ) : null}
      <p className={entry.title ? 'mt-1 text-body-sm' : undefined}>
        <TelephoneLink number={entry.value} />
      </p>
    </div>
  );
}

export type LeftRailTelephonesContentProps = {
  entries: readonly ProjectedTelephoneEntry[];
};

export function LeftRailTelephonesContent({ entries }: LeftRailTelephonesContentProps) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) {
    return null;
  }

  const canExpand = entries.length > LEFT_RAIL_PHONES_VISIBLE_COUNT;
  const visible = expanded ? entries : entries.slice(0, LEFT_RAIL_PHONES_VISIBLE_COUNT);

  const titled = entries.filter((e) => e.title && e.title.length > 0);
  const distinctTitles = new Set(titled.map((e) => e.title));
  const aggregateUnderTitle = titled.length > 0 && distinctTitles.size <= 1;

  const toggle = (
    <ShowMoreToggle
      canExpand={canExpand}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    />
  );

  if (aggregateUnderTitle) {
    const headerTitle = titled[0]?.title;
    return (
      <div>
        {headerTitle ? (
          <div className="flex items-center gap-2">
            <PhoneHandsetIcon className="shrink-0 text-muted" />
            <span className="text-body-sm font-weight-label text-fg">{headerTitle}</span>
          </div>
        ) : null}
        <TelephoneLinksInline
          entries={visible}
          className={`flex flex-wrap gap-x-1 text-body-sm ${headerTitle ? 'mt-1' : ''}`}
        />
        {toggle}
      </div>
    );
  }

  if (distinctTitles.size > 1) {
    return (
      <div>
        <ul className="flex flex-col gap-3">
          {visible.map((entry, index) => (
            <li key={`${entry.value}-${index}`}>
              <TitledTelephoneEntry entry={entry} />
            </li>
          ))}
        </ul>
        {toggle}
      </div>
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {visible.map((entry, index) => (
          <li key={`${entry.value}-${index}`}>
            <LeftRailTelephoneRow number={entry.value} />
          </li>
        ))}
      </ul>
      {toggle}
    </div>
  );
}
