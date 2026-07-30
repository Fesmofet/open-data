'use client';

import { useEffect } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useHydrateWalletProvider } from '@/modules/auth';
import { OptimisticNavLink } from '@/shared/presentation/navigation';

import { useNotificationSettings } from '../../application/use-notification-settings';
import { useSaveNotificationSettings } from '../../application/use-save-notification-settings';
import { NotificationSettingsForm } from './notification-settings-form';
import { NotificationSettingsSkeleton } from './notification-settings-skeleton';
import { notificationSettingsSaveErrorMessageKey } from '../utils/notification-settings-save-error-message';

export type NotificationSettingsPageClientProps = {
  username: string;
  telegramBotUsername: string;
  telegramBotUrl: string;
};

export function NotificationSettingsPageClient({
  username,
  telegramBotUsername,
  telegramBotUrl,
}: NotificationSettingsPageClientProps) {
  const { t } = useI18n();
  useHydrateWalletProvider();
  const { settings, isLoading, loadError, reload } = useNotificationSettings(username);
  const { save, pending, error: saveError, clearError } = useSaveNotificationSettings(username);

  useEffect(() => {
    if (settings && !loadError) {
      clearError();
    }
  }, [settings, loadError, clearError]);

  const handleSave = async (form: NonNullable<typeof settings>) => {
    const ok = await save(form);
    if (ok) {
      await reload();
    }
    return ok;
  };

  return (
    <main className="mx-auto w-full max-w-container-content px-gutter pt-section-y pb-section-y sm:px-gutter-sm">
      <header className="mb-8 space-y-4">
        <h1 className="font-display text-section font-weight-display text-heading leading-display">
          {t('notification_settings')}
        </h1>
        <p className="text-body text-fg-muted">
          <OptimisticNavLink href="/notifications" className="text-accent hover:underline">
            {t('notifications')}
          </OptimisticNavLink>
        </p>
        <p className="text-body text-fg-muted">{t('notify_list_message')}</p>
        <p className="text-body text-fg-muted">
          {t('notify_list_message_telegram_before')}{' '}
          <a
            href={telegramBotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            @{telegramBotUsername}
          </a>{' '}
          {t('notify_list_message_telegram_after')}
        </p>
      </header>

      {isLoading ? (
        <NotificationSettingsSkeleton />
      ) : loadError ? (
        <div className="space-y-4">
          <p className="text-body text-fg-muted">{t('notification_settings_load_error')}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-btn border border-border bg-surface px-4 py-2 text-body text-fg hover:bg-surface-control"
          >
            {t('profile_filters_retry')}
          </button>
        </div>
      ) : settings ? (
        <NotificationSettingsForm
          initialSettings={settings}
          pending={pending}
          saveError={
            saveError ? t(notificationSettingsSaveErrorMessageKey(saveError)) : null
          }
          onSave={handleSave}
        />
      ) : null}
    </main>
  );
}
