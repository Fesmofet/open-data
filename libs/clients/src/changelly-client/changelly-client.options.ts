export const CHANGELLY_CLIENT_MODULE_OPTIONS = Symbol(
  'CHANGELLY_CLIENT_MODULE_OPTIONS',
);

export type ChangellyClientModuleOptions = {
  privateKeyHex?: string;
  baseUrl?: string;
  requestTimeoutMs?: number;
};
