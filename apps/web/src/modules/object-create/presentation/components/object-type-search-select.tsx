'use client';

import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { Z_INDEX_DROPDOWN_ABOVE_MODAL } from '@/modules/map';

import {
  descriptionForObjectType,
  labelForObjectType,
  OBJECT_TYPE_CARD_DESCRIPTION,
} from '../../domain/object-type-display';

const DROPDOWN_MAX_HEIGHT_PX = 240;
const DROPDOWN_MIN_HEIGHT_PX = 80;
const DROPDOWN_GAP_PX = 4;

export type ObjectTypeSearchSelectProps = {
  value: string;
  onChange: (objectType: string) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
};

type DropdownRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function measureDropdownRect(input: HTMLInputElement): DropdownRect {
  const rect = input.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_GAP_PX;
  const spaceAbove = rect.top - DROPDOWN_GAP_PX;
  const openBelow =
    spaceBelow >= DROPDOWN_MIN_HEIGHT_PX || spaceBelow >= spaceAbove;

  if (openBelow) {
    const maxHeight = Math.min(
      DROPDOWN_MAX_HEIGHT_PX,
      Math.max(DROPDOWN_MIN_HEIGHT_PX, spaceBelow),
    );
    return {
      top: rect.bottom + DROPDOWN_GAP_PX,
      left: rect.left,
      width: rect.width,
      maxHeight,
    };
  }

  const maxHeight = Math.min(
    DROPDOWN_MAX_HEIGHT_PX,
    Math.max(DROPDOWN_MIN_HEIGHT_PX, spaceAbove),
  );
  return {
    top: Math.max(DROPDOWN_GAP_PX, rect.top - DROPDOWN_GAP_PX - maxHeight),
    left: rect.left,
    width: rect.width,
    maxHeight,
  };
}

function filterObjectTypes(query: string, allTypes: readonly string[]): string[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...allTypes];
  }
  return allTypes.filter((type) => {
    const label = labelForObjectType(type).toLowerCase();
    const description = (OBJECT_TYPE_CARD_DESCRIPTION[type] ?? '').toLowerCase();
    return type.includes(q) || label.includes(q) || description.includes(q);
  });
}

export function ObjectTypeSearchSelect({
  value,
  onChange,
  disabled = false,
  id: idProp,
  label,
}: ObjectTypeSearchSelectProps) {
  const { t } = useI18n();
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const listId = `${inputId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);

  const allTypes = useMemo(
    () => Object.keys(OBJECT_TYPE_REGISTRY).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const filteredTypes = useMemo(
    () => filterObjectTypes(query, allTypes),
    [allTypes, query],
  );

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !inputRef.current) {
      setDropdownRect(null);
      return;
    }
    setDropdownRect(measureDropdownRect(inputRef.current));
  }, [open, query, filteredTypes.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inputRef.current?.contains(target)) {
        return;
      }
      const list = document.getElementById(listId);
      if (list?.contains(target)) {
        return;
      }
      setOpen(false);
      if (value) {
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [listId, open, value]);

  const displayValue =
    open || !value ? query : labelForObjectType(value);

  const handleSelect = (type: string) => {
    onChange(type);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const dropdown =
    open && dropdownRect && portalReady
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            className="overflow-y-auto rounded-btn border border-border bg-bg shadow-card"
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              maxHeight: dropdownRect.maxHeight,
              zIndex: Z_INDEX_DROPDOWN_ABOVE_MODAL,
            }}
          >
            {filteredTypes.length === 0 ? (
              <li className="px-3 py-2 text-body-sm text-muted">
                {t('object_create_type_no_match')}
              </li>
            ) : (
              filteredTypes.map((type) => {
                const selected = type === value;
                const description = descriptionForObjectType(type);
                return (
                  <li key={type}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={[
                        'flex w-full flex-col gap-0.5 px-3 py-2 text-start',
                        selected ? 'bg-ghost-surface' : 'hover:bg-ghost-surface',
                      ].join(' ')}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(type)}
                    >
                      <span className="text-body-sm font-weight-label text-fg">
                        {labelForObjectType(type)}
                      </span>
                      {description ? (
                        <span className="text-caption text-muted">{description}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <label className="block text-body-sm">
      {label ? <span className="text-muted">{label}</span> : null}
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={t('select_type')}
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) {
            setOpen(true);
          }
          if (value) {
            onChange('');
          }
        }}
        onFocus={() => {
          setOpen(true);
          if (value) {
            setQuery(labelForObjectType(value));
            onChange('');
          }
        }}
        className={[
          'mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg',
          'disabled:cursor-default disabled:opacity-100 disabled:text-fg',
        ].join(' ')}
      />
      {dropdown}
    </label>
  );
}
