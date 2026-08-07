'use client';

import { useMemo, useState, type FocusEvent } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { ObjectOptionValueView } from '../../domain/object-page.types';

import {
  buildOptionsBack,
  buildOwnOptions,
  optionButtonClassName,
  optionImageSrc,
  OPTION_SWATCH_SIZE_PX,
  resolveNavigationTarget,
  sortOptionCategories,
  type SelectionMap,
} from './object-options-section.utils';

type ObjectOptionsSectionProps = {
  currentObjectId: string;
  categories: { category: string; values: ObjectOptionValueView[] }[];
  hoveredOption?: ObjectOptionValueView | null;
  onOptionHover?: (entry: ObjectOptionValueView | null) => void;
};

function OptionSwatchImage({ entry }: { entry: ObjectOptionValueView }) {
  const primary = optionImageSrc(entry);
  const fallback = entry.imageUrl?.trim() || null;
  const [src, setSrc] = useState(primary);

  if (!src) {
    return null;
  }

  return (
    <span className="relative block size-full shrink-0 bg-bg">
      <Image
        src={src}
        alt=""
        fill
        sizes={`${OPTION_SWATCH_SIZE_PX}px`}
        className="object-contain"
        unoptimized
        onError={() => {
          if (fallback && fallback !== src) {
            setSrc(fallback);
          }
        }}
      />
    </span>
  );
}

function OptionCategoryBlock({
  category,
  values,
  currentObjectId,
  ownOptions,
  activeSelection,
  optionsBack,
  hoveredOption,
  onSelect,
  onOptionHover,
}: {
  category: string;
  values: ObjectOptionValueView[];
  currentObjectId: string;
  ownOptions: SelectionMap;
  activeSelection: SelectionMap;
  optionsBack: Record<string, string[]>;
  hoveredOption?: ObjectOptionValueView | null;
  onSelect: (entry: ObjectOptionValueView) => void;
  onOptionHover?: (entry: ObjectOptionValueView | null) => void;
}) {
  const selectedEntry = activeSelection[category] ?? ownOptions[category];
  const displayValue =
    hoveredOption?.category === category
      ? hoveredOption.value
      : (selectedEntry?.value ?? '');

  const previewHandlers = (entry: ObjectOptionValueView) => ({
    onMouseEnter: () => onOptionHover?.(entry),
    onFocus: () => onOptionHover?.(entry),
  });

  return (
    <div className="space-y-2">
      <p className="text-body-sm text-muted">
        <span>{category}: </span>
        {displayValue ? (
          <span className="font-weight-strong text-accent">{displayValue}</span>
        ) : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {values.map((entry) => {
          const isSelected = selectedEntry?.value === entry.value;
          const className = optionButtonClassName({
            entry,
            currentObjectId,
            ownOptions,
            activeSelection,
            optionsBack,
            isSelected,
          });

          if (optionImageSrc(entry)) {
            const swatchClassName = optionButtonClassName({
              entry,
              currentObjectId,
              ownOptions,
              activeSelection,
              optionsBack,
              isSelected,
              mode: 'swatch',
            });

            return (
              <button
                key={`${entry.category}-${entry.value}-${entry.objectId}`}
                type="button"
                className={swatchClassName}
                onClick={() => onSelect(entry)}
                aria-pressed={isSelected}
                aria-label={`${entry.category} ${entry.value}`}
                {...previewHandlers(entry)}
              >
                <OptionSwatchImage
                  key={`${entry.objectId}-${entry.image ?? ''}`}
                  entry={entry}
                />
              </button>
            );
          }

          return (
            <button
              key={`${entry.category}-${entry.value}-${entry.objectId}`}
              type="button"
              className={className}
              onClick={() => onSelect(entry)}
              aria-pressed={isSelected}
              {...previewHandlers(entry)}
            >
              {entry.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ObjectOptionsSection({
  currentObjectId,
  categories,
  hoveredOption = null,
  onOptionHover,
}: ObjectOptionsSectionProps) {
  const router = useRouter();
  const optionsBack = useMemo(() => buildOptionsBack(categories), [categories]);
  const ownOptions = useMemo(
    () => buildOwnOptions(currentObjectId, categories),
    [currentObjectId, categories],
  );
  const [activeSelection, setActiveSelection] = useState<SelectionMap>(() => ({ ...ownOptions }));
  const sortedCategories = useMemo(() => sortOptionCategories(categories), [categories]);

  const handleSelect = (entry: ObjectOptionValueView) => {
    setActiveSelection((prev) => ({ ...prev, [entry.category]: entry }));
    if (entry.objectId !== currentObjectId) {
      const target = resolveNavigationTarget(entry, ownOptions, optionsBack);
      router.push(`/object/${encodeURIComponent(target)}`);
    }
  };

  const handleSectionBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onOptionHover?.(null);
    }
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" onMouseLeave={() => onOptionHover?.(null)} onBlur={handleSectionBlur}>
      {sortedCategories.map(({ category, values }) => (
        <OptionCategoryBlock
          key={category}
          category={category}
          values={values}
          currentObjectId={currentObjectId}
          ownOptions={ownOptions}
          activeSelection={activeSelection}
          optionsBack={optionsBack}
          hoveredOption={hoveredOption}
          onSelect={handleSelect}
          onOptionHover={onOptionHover}
        />
      ))}
    </div>
  );
}
