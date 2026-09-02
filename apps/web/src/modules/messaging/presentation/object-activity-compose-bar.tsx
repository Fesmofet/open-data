'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { CompactComposeEditor } from '@/modules/editor';
import { CloseIcon } from '@/icons';
import { useI18n } from '@/i18n/providers/i18n-provider';

import { buildMessagingMarkdownFromLexical } from '../application/build-messaging-markdown';
import { canSendMessageBody, formatOriginalCreatedAtLabel } from '../domain/messaging.helpers';
import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';
import { ActivityOriginalDatePicker } from './activity-original-date-picker';

export type ObjectActivityComposeBarProps = {
  objectName: string;
  viewerUsername: string | null;
  pending?: boolean;
  onSend: (body: string, originalCreatedAtUnix: number | null) => void | Promise<void>;
  onRequireLogin?: () => void;
};

export function ObjectActivityComposeBar({
  objectName,
  viewerUsername,
  pending = false,
  onSend,
  onRequireLogin,
}: ObjectActivityComposeBarProps) {
  const { t, locale } = useI18n();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const [bodyLexicalJson, setBodyLexicalJson] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [originalCreatedAtUnix, setOriginalCreatedAtUnix] = useState<number | null>(null);
  const originalCreatedAtUnixRef = useRef(originalCreatedAtUnix);
  originalCreatedAtUnixRef.current = originalCreatedAtUnix;

  const markdownBody = useMemo(
    () => buildMessagingMarkdownFromLexical(bodyLexicalJson, contentBaseUrl),
    [bodyLexicalJson, contentBaseUrl],
  );

  const canSubmit = canSendMessageBody(markdownBody) && !pending;

  const handleSubmit = useCallback(async () => {
    if (!canSendMessageBody(markdownBody) || pending) {
      return;
    }
    if (!viewerUsername?.trim()) {
      onRequireLogin?.();
      return;
    }
    const value = markdownBody;
    const stamp = originalCreatedAtUnix;
    setBodyLexicalJson('');
    setOriginalCreatedAtUnix(null);
    setEditorKey((key) => key + 1);
    await onSend(value, stamp);
  }, [
    markdownBody,
    onRequireLogin,
    onSend,
    originalCreatedAtUnix,
    pending,
    viewerUsername,
  ]);

  const placeholder = t('object_activity_compose_placeholder').replace(
    '{name}',
    objectName.trim() || t('object'),
  );

  const chipLabel =
    originalCreatedAtUnix != null
      ? formatOriginalCreatedAtLabel(originalCreatedAtUnix, locale)
      : null;

  const renderOriginalDatePicker = useCallback(
    (props: { onSelect: (unix: number) => void }) => (
      <ActivityOriginalDatePicker
        onSelect={props.onSelect}
        initialUnix={originalCreatedAtUnixRef.current}
      />
    ),
    [],
  );

  return (
    <CompactComposeEditor
      className="mb-4"
      editorKey={editorKey}
      bodyPlaceholder={placeholder}
      onBodyChange={setBodyLexicalJson}
      onSend={handleSubmit}
      canSend={canSubmit}
      sendAriaLabel={t('messaging_send')}
      sendVariant="accent"
      outputMode="lexical"
      enableOriginalCreatedAt
      insertPanelPreferBelow
      renderOriginalDatePicker={renderOriginalDatePicker}
      onOriginalCreatedAtSelected={setOriginalCreatedAtUnix}
      footer={
        chipLabel ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-control px-3 py-1 text-caption text-muted">
              {t('object_activity_original_date_chip').replace('{datetime}', chipLabel)}
              <button
                type="button"
                className="text-fg-secondary hover:text-fg"
                aria-label={t('object_activity_original_date_clear_aria')}
                onClick={() => setOriginalCreatedAtUnix(null)}
              >
                <CloseIcon size={14} />
              </button>
            </span>
          </div>
        ) : null
      }
    />
  );
}
