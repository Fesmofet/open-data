'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchNotificationSettingsClient } from '../infrastructure/notification-settings.browser.client';
import { mapApiToForm } from './map-notification-settings';
import type { NotificationSettingsFormState } from './notification-settings.types';

export type UseNotificationSettingsResult = {
  settings: NotificationSettingsFormState | null;
  isLoading: boolean;
  loadError: boolean;
  reload: () => Promise<void>;
};

export function useNotificationSettings(username: string): UseNotificationSettingsResult {
  const [settings, setSettings] = useState<NotificationSettingsFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    const dto = await fetchNotificationSettingsClient(username);
    if (!dto) {
      setSettings(null);
      setLoadError(true);
    } else {
      setSettings(mapApiToForm(dto));
    }
    setIsLoading(false);
  }, [username]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { settings, isLoading, loadError, reload };
}
