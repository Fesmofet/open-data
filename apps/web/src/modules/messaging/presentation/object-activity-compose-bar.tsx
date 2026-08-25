'use client';

import { useCallback, useMemo, useState } from 'react';

import { CompactComposeEditor } from '@/modules/editor';
import { useI18n } from '@/i18n/providers/i18n-provider';

import { buildMessagingMarkdownFromLexical } from '../application/build-messaging-markdown';
import { canSendMessageBody } from '../domain/messaging.helpers';
import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';

export type ObjectActivityComposeBarProps = {
  objectName: string;
  viewerUsername: string | null;
  pending?: boolean;
  onSend: (body: string) => void | Promise<void>;
  onRequireLogin?: () => void;
};

export function ObjectActivityComposeBar({
  objectName,
  viewerUsername,
  pending = false,
  onSend,
  onRequireLogin,
}: ObjectActivityComposeBarProps) {
  const { t } = useI18n();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const [bodyLexicalJson, setBodyLexicalJson] = useState('');
  const [editorKey, setEditorKey] = useState(0);

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
    setBodyLexicalJson('');
    setEditorKey((key) => key + 1);
    await onSend(value);
  }, [markdownBody, onRequireLogin, onSend, pending, viewerUsername]);

  const placeholder = t('object_activity_compose_placeholder').replace(
    '{name}',
    objectName.trim() || t('object'),
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
    />
  );
}
