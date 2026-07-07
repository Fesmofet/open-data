export interface EthGatewayClientInterface {
  getSwapEthWithdrawalFee(): Promise<number | null>;
}
