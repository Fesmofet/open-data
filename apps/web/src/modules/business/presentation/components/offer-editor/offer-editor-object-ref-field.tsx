'use client';

import { useCallback, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { EditorCreateObjectModal } from '@/modules/editor/presentation/components/editor-create-object-modal';
import { ObjectRefSearchField } from '@/modules/object-updates/presentation/components/object-ref-search-field';

export type OfferEditorObjectRefFieldProps = {
  username: string;
  label: string;
  value: string;
  onChange: (objectId: string) => void;
  objectType: string;
};

export function OfferEditorObjectRefField({
  username,
  label,
  value,
  onChange,
  objectType,
}: OfferEditorObjectRefFieldProps) {
  const { t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreated = useCallback(
    async (objectId: string) => {
      onChange(objectId);
    },
    [onChange],
  );

  return (
    <>
      <div>
        <ObjectRefSearchField
          label={label}
          value={value}
          onChange={(objectId) => onChange(objectId)}
          appliesTo={[objectType]}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="text-body-sm text-link hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t('create_new_object')}
          </button>
        </div>
      </div>

      <EditorCreateObjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        username={username}
        initialObjectType={objectType}
        lockObjectType
        onCreated={handleCreated}
      />
    </>
  );
}
