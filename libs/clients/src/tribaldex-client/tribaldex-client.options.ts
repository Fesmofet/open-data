export const TRIBALDEX_CLIENT_MODULE_OPTIONS = Symbol(
  'TRIBALDEX_CLIENT_MODULE_OPTIONS',
);

export type TribaldexClientModuleOptions = {
  baseUrl?: string;
  requestTimeoutMs?: number;
};
