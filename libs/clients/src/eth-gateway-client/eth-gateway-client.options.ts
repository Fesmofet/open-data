export const ETH_GATEWAY_CLIENT_MODULE_OPTIONS = Symbol(
  'ETH_GATEWAY_CLIENT_MODULE_OPTIONS',
);

export type EthGatewayClientModuleOptions = {
  baseUrl?: string;
  requestTimeoutMs?: number;
};
