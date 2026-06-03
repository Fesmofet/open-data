'use client';

import { useMemo, useState } from 'react';

import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  OBJECT_TYPE_CARD_DESCRIPTION,
  OBJECT_TYPE_GROUP_I18N_KEY,
  OBJECT_TYPE_GROUPS,
  labelForObjectType,
  type ObjectTypeSelectorGroupId,
} from '../../domain/object-type-display';
import { ObjectTypeGroupIcon } from './object-type-group-icons';

export type ObjectTypeSelectorProps = {
  onSelect: (objectType: string) => void;
  disabled?: boolean;
};

type GroupRow = {
  id: ObjectTypeSelectorGroupId;
  types: string[];
};

export function ObjectTypeSelector({
  onSelect,
  disabled = false,
}: ObjectTypeSelectorProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const allTypes = useMemo(
    () => Object.keys(OBJECT_TYPE_REGISTRY).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const filteredSet = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return new Set(allTypes);
    }
    return new Set(
      allTypes.filter((type) => {
        const label = labelForObjectType(type).toLowerCase();
        const description = (OBJECT_TYPE_CARD_DESCRIPTION[type] ?? '').toLowerCase();
        return type.includes(q) || label.includes(q) || description.includes(q);
      }),
    );
  }, [allTypes, query]);

  const grouped = useMemo((): GroupRow[] => {
    const hasSearch = query.trim().length > 0;
    const rows: GroupRow[] = [];
    const inAnyGroup = new Set<string>();

    for (const group of OBJECT_TYPE_GROUPS) {
      for (const type of group.types) {
        inAnyGroup.add(type);
      }
    }

    for (const group of OBJECT_TYPE_GROUPS) {
      if (hasSearch && group.id === 'popular') {
        continue;
      }
      const types = group.types.filter(
        (type) => OBJECT_TYPE_REGISTRY[type] && filteredSet.has(type),
      );
      if (types.length > 0) {
        rows.push({ id: group.id, types });
      }
    }

    const other = allTypes.filter(
      (type) => filteredSet.has(type) && !inAnyGroup.has(type),
    );
    if (other.length > 0) {
      rows.push({ id: 'other', types: other });
    }

    return rows;
  }, [allTypes, filteredSet, query]);

  const hasResults = grouped.some((g) => g.types.length > 0);

  return (
    <div>
      <input
        type="search"
        className="w-full rounded-btn border border-border bg-bg px-3 py-2 text-body-sm text-fg placeholder:text-muted outline-none focus:border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        placeholder={t('object_create_type_search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        aria-label={t('object_create_type_search')}
      />

      <div className="mt-4 space-y-4">
        {grouped.map((group) => (
          <section key={`${group.id}-${group.types.join(',')}`}>
            <GroupHeader groupId={group.id} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {group.types.map((type) => (
                <TypeCard
                  key={`${group.id}-${type}`}
                  type={type}
                  onSelect={onSelect}
                  disabled={disabled}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {!hasResults ? (
        <p className="mt-4 text-body-sm text-muted">{t('object_create_type_no_match')}</p>
      ) : null}
    </div>
  );
}

function GroupHeader({ groupId }: { groupId: ObjectTypeSelectorGroupId }) {
  const { t } = useI18n();
  const labelKey = OBJECT_TYPE_GROUP_I18N_KEY[groupId];

  return (
    <div className="mb-2 flex items-center gap-2">
      <ObjectTypeGroupIcon
        groupId={groupId}
        className="size-4 shrink-0 text-fg-secondary"
      />
      <h2 className="text-body-sm font-weight-label text-fg">{t(labelKey)}</h2>
    </div>
  );
}

function TypeCard({
  type,
  onSelect,
  disabled,
}: {
  type: string;
  onSelect: (type: string) => void;
  disabled: boolean;
}) {
  const label = labelForObjectType(type);
  const description = OBJECT_TYPE_CARD_DESCRIPTION[type] ?? '';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(type)}
      className={[
        'w-full rounded-btn border border-border bg-surface px-3 py-2 text-start transition-colors hover:bg-ghost-surface',
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="block truncate font-weight-label text-body-sm text-fg">
        {label}
      </span>
      {description ? (
        <span className="mt-0.5 block truncate text-caption text-muted">
          {description}
        </span>
      ) : null}
    </button>
  );
}
