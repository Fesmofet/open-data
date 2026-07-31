import { NotificationSettingsSkeleton } from '@/modules/notifications/presentation/components/notification-settings-skeleton';

export default function NotificationSettingsLoading() {
  return (
    <div>
      <div className="mb-8 h-10 w-64 animate-pulse rounded bg-surface-control" />
      <NotificationSettingsSkeleton />
    </div>
  );
}
