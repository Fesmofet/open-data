'use client';

import { OptimisticNavLink } from '@/shared/presentation/navigation';

import { useI18n } from '@/i18n/providers/i18n-provider';

export type NotificationsPageIntroProps = {
  telegramBotUsername: string;
  telegramBotUrl: string;
};

export function NotificationsPageIntro({
  telegramBotUsername,
  telegramBotUrl,
}: NotificationsPageIntroProps) {
  const { t } = useI18n();

  return (
    <header className="mb-6">
      <h1 className="font-display text-section font-weight-display text-heading leading-display">
        {t('notifications')}(
        <OptimisticNavLink
          href="/notifications/settings"
          className="text-accent hover:underline [font:inherit]"
        >
          {t('settings_notify')}
        </OptimisticNavLink>
        )
      </h1>
      <p className="mt-4 text-body text-fg-muted">{t('notify_list_message')}</p>
      <p className="mt-3 text-body text-fg-muted">
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
  );
}
