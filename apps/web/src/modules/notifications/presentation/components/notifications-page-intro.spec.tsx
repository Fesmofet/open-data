/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react';

import { NotificationsPageIntro } from './notifications-page-intro';

jest.mock('@/shared/presentation/navigation', () => ({
  OptimisticNavLink: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        notifications: 'Notifications',
        settings_notify: 'settings',
        notify_list_message: 'Intro paragraph.',
        notify_list_message_telegram_before: 'To get started, open a chat with',
        notify_list_message_telegram_after:
          'on Telegram and enter your Hive username(s) to subscribe.',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('NotificationsPageIntro', () => {
  it('renders settings and Telegram links', () => {
    render(
      <NotificationsPageIntro
        telegramBotUsername="WaivioNotificationsBot"
        telegramBotUrl="https://t.me/WaivioNotificationsBot"
      />,
    );

    const settings = screen.getByRole('link', { name: 'settings' });
    expect(settings).toHaveAttribute('href', '/notifications/settings');

    const bot = screen.getByRole('link', { name: '@WaivioNotificationsBot' });
    expect(bot).toHaveAttribute('href', 'https://t.me/WaivioNotificationsBot');
    expect(bot).toHaveAttribute('target', '_blank');
  });
});
