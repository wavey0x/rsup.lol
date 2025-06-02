export interface MarketData {
  marketName: string;
  protocolId: number;
  depositTokenLogo: string;
  collateralTokenLogo: string;
  protocolLogo: string;
  utilization: number;
  liquidity: number;
  borrowRate: number;
  lendRate: number;
  ltv: number;
  contractAddress: string;
  protocolLink: string;
  depositTokenAddress: string;
  collateralTokenAddress: string;
  resupplyPairAddress: string;
  depositTokenSymbol: string;
  collateralTokenSymbol: string;
  controller: string;
  interestRateContract: string;
  resupplyBorrowLimit: number;
  deprecated: boolean;
  totalDebt: number;
}

export interface MarketInfo {
  marketName: string;
  protocolId: number;
  contractAddress: string;
  protocolLink: string;
}
