'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { useIpfsContentBaseUrl } from '@/config/ipfs-content-base-provider';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { AppModal, AppModalCloseButton, IpfsImageDropZone } from '@/shared/presentation';

import {
  remainingGroupMemberSlots,
  resolveChannelImageUrl,
} from '../domain/messaging.helpers';
import type { ChannelDetail } from '../domain/messaging.types';
import {
  validateChannelMembers,
  type ValidateMemberReason,
} from '../infrastructure/messaging-validate.client';
import {
  MessagingUserPicker,
  type MessagingUserPickerHit,
} from './messaging-user-picker';

export type EditGroupModalProps = {
  open: boolean;
  onClose: () => void;
  channel: ChannelDetail | null;
  viewerUsername: string | null;
  pending?: boolean;
  addPending?: boolean;
  onSave: (input: { title: string; imageCid?: string }) => void | Promise<void>;
  onAddMembers?: (accounts: string[]) => void | Promise<void>;
};

export function EditGroupModal({
  open,
  onClose,
  channel,
  viewerUsername,
  pending = false,
  addPending = false,
  onSave,
  onAddMembers,
}: EditGroupModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const contentBaseUrl = useIpfsContentBaseUrl();
  const initialTitle = channel?.title ?? channel?.display_title ?? '';
  const [title, setTitle] = useState(initialTitle);
  const [imageCid, setImageCid] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<MessagingUserPickerHit[]>([]);
  const [blockReasons, setBlockReasons] = useState<Map<string, ValidateMemberReason>>(
    new Map(),
  );

  const memberCount = channel?.members.length ?? 0;
  const remainingSlots = remainingGroupMemberSlots(memberCount);
  const excludedAccounts = useMemo(
    () => channel?.members.map((member) => member.account) ?? [],
    [channel?.members],
  );

  useEffect(() => {
    if (open && channel) {
      setTitle(channel.title ?? channel.display_title ?? '');
      setImageCid(null);
      setPreviewUrl(resolveChannelImageUrl(channel.image, contentBaseUrl));
      setSelectedToAdd([]);
      setBlockReasons(new Map());
    }
  }, [channel, contentBaseUrl, open]);

  const validateAccounts = useCallback(
    async (accounts: readonly string[]) => {
      const viewer = viewerUsername?.trim();
      const channelId = channel?.channel_id;
      if (!viewer || !channelId || accounts.length === 0) {
        return;
      }
      const response = await validateChannelMembers(channelId, viewer, accounts);
      if (!response) {
        return;
      }
      setBlockReasons((prev) => {
        const next = new Map(prev);
        for (const row of response.results) {
          const key = row.account.toLowerCase();
          if (!row.addable && row.reason) {
            next.set(key, row.reason);
          } else {
            next.delete(key);
          }
        }
        return next;
      });
    },
    [channel?.channel_id, viewerUsername],
  );

  useEffect(() => {
    if (!open || selectedToAdd.length === 0) {
      return;
    }
    void validateAccounts(selectedToAdd.map((hit) => hit.name));
  }, [open, selectedToAdd, validateAccounts]);

  const trimmedTitle = title.trim();
  const hasChanges =
    (trimmedTitle.length > 0 &&
      trimmedTitle !== (channel?.title ?? channel?.display_title ?? '').trim()) ||
    imageCid != null;
  const canSave = hasChanges && trimmedTitle.length > 0 && trimmedTitle.length <= 256;
  const addableSelected = selectedToAdd.filter(
    (hit) => !blockReasons.has(hit.name.toLowerCase()),
  );
  const canAddMembers =
    addableSelected.length > 0 && remainingSlots > 0 && !addPending && !pending;

  const avatarPreview =
    previewUrl ?? (channel ? resolveChannelImageUrl(channel.image, contentBaseUrl) : null);
  const avatarInitial = useMemo(
    () => trimmedTitle.charAt(0).toUpperCase() || '#',
    [trimmedTitle],
  );

  return (
    <AppModal open={open} onClose={onClose} labelledBy={titleId} panelClassName="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-section font-weight-strong text-fg">
          {t('messaging_edit_group')}
        </h2>
        <AppModalCloseButton onClose={onClose} ariaLabel={t('close')} />
      </div>
      <div className="flex flex-col items-center">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt=""
            className="size-[4.5rem] rounded-full object-cover"
          />
        ) : (
          <div className="flex size-[4.5rem] items-center justify-center rounded-full bg-surface-control text-heading-sm font-weight-strong text-fg-secondary">
            {avatarInitial}
          </div>
        )}
      </div>
      <label className="mt-4 block">
        <span className="mb-1 block text-body-sm font-weight-label text-fg">
          {t('messaging_edit_group_title')}
        </span>
        <input
          type="text"
          value={title}
          maxLength={256}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-btn border border-border bg-surface px-3 py-2 text-body-sm text-fg"
        />
      </label>
      <div className="mt-4">
        <p className="mb-2 text-body-sm font-weight-label text-fg">
          {t('messaging_edit_group_photo')}
        </p>
        <IpfsImageDropZone
          compact
          onUploaded={(result) => {
            setImageCid(result.cid);
            setPreviewUrl(result.previewUrl);
          }}
          disabled={pending}
        />
      </div>
      {onAddMembers ? (
        <div className="mt-6 border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-body-sm font-weight-label text-fg">{t('messaging_add_members')}</p>
            <p className="text-caption text-muted">
              {t('messaging_slots_remaining').replace('{count}', String(remainingSlots))}
            </p>
          </div>
          <MessagingUserPicker
            key={channel?.channel_id ?? 'closed'}
            viewerUsername={viewerUsername}
            excludedAccounts={excludedAccounts}
            maxSelectable={remainingSlots}
            blockReasons={blockReasons}
            onSelectionChange={setSelectedToAdd}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
              disabled={!canAddMembers}
              onClick={() => {
                void (async () => {
                  await onAddMembers(addableSelected.map((hit) => hit.name));
                  setSelectedToAdd([]);
                })();
              }}
            >
              {t('messaging_add_members_submit')}
            </button>
          </div>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-btn px-4 py-2 text-body-sm text-fg hover:bg-surface-control"
          onClick={onClose}
          disabled={pending}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          className="rounded-btn bg-accent px-4 py-2 text-body-sm font-weight-label text-accent-fg disabled:opacity-50"
          disabled={!canSave || pending}
          onClick={() =>
            void onSave({
              title: trimmedTitle,
              imageCid: imageCid ?? undefined,
            })
          }
        >
          {t('messaging_edit_group_save')}
        </button>
      </div>
    </AppModal>
  );
}
