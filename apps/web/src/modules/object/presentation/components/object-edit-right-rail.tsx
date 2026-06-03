'use client';

import { useMemo } from 'react';

import {
  ObjectHealthPanel,
  ObjectPreviewPanel,
} from '@/modules/object-create/presentation';
import { computeSemanticCompleteness } from '@/modules/object-create/domain/semantic-completeness';

import { objectPageModelToPreviewFields } from '../../application/mappers/object-page-to-preview-fields';
import type { ObjectPageViewModel } from '../../domain/object-page.types';

export type ObjectEditRightRailProps = {
  model: ObjectPageViewModel;
};

export function ObjectEditRightRail({ model }: ObjectEditRightRailProps) {
  const fields = useMemo(
    () => objectPageModelToPreviewFields(model),
    [model],
  );

  const completeness = useMemo(
    () => computeSemanticCompleteness(model.objectTypeKey, fields),
    [model.objectTypeKey, fields],
  );

  return (
    <aside className="flex w-full min-w-0 flex-col gap-6 lg:sticky lg:top-[calc(var(--app-header-height,4rem)+1rem)]">
      <ObjectPreviewPanel
        objectType={model.objectTypeKey}
        objectId={model.objectId}
        fields={fields}
      />
      <ObjectHealthPanel completeness={completeness} />
    </aside>
  );
}
