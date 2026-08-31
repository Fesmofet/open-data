'use client';

import { Fragment, useState } from 'react';

import { PhoneIcon } from '@/icons';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { telephoneHref } from '@/modules/object-updates/application/telephone-display.utils';
import { HydrationSafeAnchor } from '@/shared/presentation';

import type { ProjectedTelephoneEntry } from '../../infrastructure/object-projected-fields';

const LEFT_RAIL_PHONES_VISIBLE_COUNT = 3;

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
      <PhoneIcon size="md" className="shrink-0 text-muted" />
      <TelephoneLink number={trimmed} />
    </div>
  );
}

function TitledTelephoneEntry({ entry }: { entry: ProjectedTelephoneEntry }) {
  return (
    <div>
      {entry.title ? (
        <div className="flex items-center gap-2">
          <PhoneIcon size="md" className="shrink-0 text-muted" />
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
            <PhoneIcon size="md" className="shrink-0 text-muted" />
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
