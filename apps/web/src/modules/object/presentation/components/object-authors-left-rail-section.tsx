'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { shouldUnoptimizeRemoteImage } from '@/shared/presentation';

import type { ObjectRefItem } from '../../domain/object-page.types';

const BY_LABEL_COLUMN_CLASS = 'inline-flex w-7 shrink-0 justify-end';

export type ObjectAuthorsLeftRailSectionProps = {
  items: ObjectRefItem[];
  editToolbar?: React.ReactNode;
};

function AuthorRefRow({ item }: { item: ObjectRefItem }) {
  return (
    <Link
      href={`/object/${encodeURIComponent(item.objectId)}`}
      prefetch={false}
      suppressHydrationWarning
      className="-mx-1 -my-0.5 flex min-w-0 flex-1 items-center gap-2 rounded-btn p-1 transition-colors hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {item.imageUrl ? (
        <div className="relative size-8 shrink-0 overflow-hidden rounded-btn border border-border bg-surface">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="32px"
            unoptimized={shouldUnoptimizeRemoteImage(item.imageUrl)}
          />
        </div>
      ) : null}
      <span className="min-w-0 break-words text-accent">{item.name}</span>
    </Link>
  );
}

/** Legacy Waivio book authors: "By" + stacked author links (optional avatar). */
export function ObjectAuthorsLeftRailSection({
  items,
  editToolbar,
}: ObjectAuthorsLeftRailSectionProps) {
  const { t } = useI18n();

  return (
    <div className="w-full">
      {editToolbar}
      {items.length > 0 ? (
        <ul className="mt-1 list-none space-y-1 p-0">
          {items.map((item, index) => (
            <li key={item.objectId} className="flex min-w-0 items-center gap-2 text-body-sm">
              <span
                className={[
                  BY_LABEL_COLUMN_CLASS,
                  index === 0 ? 'text-muted' : '',
                ].join(' ')}
                aria-hidden={index > 0}
              >
                {index === 0 ? t('by_only') : null}
              </span>
              <AuthorRefRow item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
