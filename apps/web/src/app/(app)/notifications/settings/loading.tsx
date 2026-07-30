import { NotificationSettingsSkeleton } from '@/modules/notifications/presentation/components/notification-settings-skeleton';

export default function NotificationSettingsLoading() {
  return (
    <main className="mx-auto w-full max-w-container-content px-gutter pt-section-y pb-section-y sm:px-gutter-sm">
      <div className="mb-8 h-10 w-64 animate-pulse rounded bg-surface-control" />
      <NotificationSettingsSkeleton />
    </main>
  );
}
