'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';

import { setHasConfigClient } from './has-config.client';

export type HasConfig = {
  wsUrl: string;
  appName: string;
};

import { DEFAULT_HAS_WS_URL } from './has.constants';

const HasConfigContext = createContext<HasConfig>({
  wsUrl: DEFAULT_HAS_WS_URL,
  appName: 'Waivio',
});

export type HasConfigProviderProps = HasConfig & {
  children: ReactNode;
};

export function HasConfigProvider({
  wsUrl,
  appName,
  children,
}: HasConfigProviderProps) {
  useEffect(() => {
    setHasConfigClient({ wsUrl, appName });
  }, [wsUrl, appName]);

  return (
    <HasConfigContext.Provider value={{ wsUrl, appName }}>
      {children}
    </HasConfigContext.Provider>
  );
}

export function useHasConfig(): HasConfig {
  return useContext(HasConfigContext);
}
