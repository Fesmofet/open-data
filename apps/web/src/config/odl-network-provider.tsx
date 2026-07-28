'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { CUSTOM_JSON_ID } from './odl-network';

const OdlCustomJsonIdContext = createContext<string>(CUSTOM_JSON_ID.ODL_MAINNET);
const OblCustomJsonIdContext = createContext<string>(CUSTOM_JSON_ID.OBL_MAINNET);
const OslCustomJsonIdContext = createContext<string>(CUSTOM_JSON_ID.OSL_MAINNET);

export type OdlNetworkProviderProps = {
  customJsonId: string;
  oblCustomJsonId: string;
  oslCustomJsonId: string;
  children: ReactNode;
};

/**
 * Supplies Hive `custom_json.id` from server runtime env (`ODL_NETWORK`).
 * Client broadcasts must use {@link useOdlCustomJsonId} / {@link useOblCustomJsonId}.
 */
export function OdlNetworkProvider({
  customJsonId,
  oblCustomJsonId,
  oslCustomJsonId,
  children,
}: OdlNetworkProviderProps) {
  return (
    <OdlCustomJsonIdContext.Provider value={customJsonId}>
      <OblCustomJsonIdContext.Provider value={oblCustomJsonId}>
        <OslCustomJsonIdContext.Provider value={oslCustomJsonId}>
          {children}
        </OslCustomJsonIdContext.Provider>
      </OblCustomJsonIdContext.Provider>
    </OdlCustomJsonIdContext.Provider>
  );
}

export function useOdlCustomJsonId(): string {
  return useContext(OdlCustomJsonIdContext);
}

export function useOblCustomJsonId(): string {
  return useContext(OblCustomJsonIdContext);
}

export function useOslCustomJsonId(): string {
  return useContext(OslCustomJsonIdContext);
}
