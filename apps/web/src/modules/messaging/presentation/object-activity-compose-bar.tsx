'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { CompactComposeEditor } from '@/modules/editor';
import { CloseIcon } from '@/icons';
import { useI18n } from '@/i18n/providers/i18n-provider';

import { buildMessagingMarkdownFromLexical } from '../application/build-messaging-markdown';
import { canSendMessageBody, formatOriginalCreatedAtLabel } from '../domain/messaging.helpers';
import type { MessagingComposeIntent } from '../domain/messaging.types';
import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';
import { ActivityOriginalDatePicker } from './activity-original-date-picker';
import { MessagingComposeIntentStrip } from './messaging-compose-intent-strip';

export type ObjectActivityComposeBarProps = {
  objectName: string;
  viewerUsername: string | null;
  pending?: boolean;
  editorKey?: number;
  composeIntent?: MessagingComposeIntent;
  onDismissComposeIntent?: () => void;
  initialBody?: string;
  sendAriaLabel?: string;
  onSend: (
    body: string,
    originalCreatedAtUnix: number | null,
  ) => boolean | void | Promise<boolean | void>;
  onRequireLogin?: () => void;
};

export function ObjectActivityComposeBar({
  objectName,
  viewerUsername,
  pending = false,
  editorKey = 0,
  composeIntent = null,
  onDismissComposeIntent,
  initialBody,
  sendAriaLabel,
  onSend,
  onRequireLogin,
}: ObjectActivityComposeBarProps) {
  const { t, locale } = useI18n();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const [bodyLexicalJson, setBodyLexicalJson] = useState('');
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
    const stamp = composeIntent ? null : originalCreatedAtUnix;
    const ok = await onSend(value, stamp);
    if (ok !== false) {
      setBodyLexicalJson('');
      setOriginalCreatedAtUnix(null);
    }
  }, [
    composeIntent,
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
    <div className="mb-4">
      {composeIntent ? (
        <MessagingComposeIntentStrip
          intent={composeIntent}
          onDismiss={() => onDismissComposeIntent?.()}
        />
      ) : null}
      <CompactComposeEditor
        className=""
        editorKey={editorKey}
        initialBody={initialBody}
        bodyPlaceholder={placeholder}
        onBodyChange={setBodyLexicalJson}
        onSend={handleSubmit}
        canSend={canSubmit}
        sendAriaLabel={sendAriaLabel ?? t('messaging_send')}
        sendVariant="accent"
        outputMode="lexical"
        enableOriginalCreatedAt={composeIntent == null}
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
    </div>
  );
}
