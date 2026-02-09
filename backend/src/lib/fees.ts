export type FeeBreakdown = {
  contracts: number;
  price: number;
  probabilityFactor: number;
  component1: number;
  component2: number;
  totalFee: number;
};

export function calculateFeeBreakdown(contracts: number, price: number): FeeBreakdown {
  const probabilityFactor = price * (1 - price);
  const component1 = Math.ceil(0.07 * contracts * probabilityFactor);
  const component2 = 0.01 * contracts * probabilityFactor;
  const totalFee = component1 + component2;
  return { contracts, price, probabilityFactor, component1, component2, totalFee };
}

export function calculateFee(contracts: number, price: number): number {
  return calculateFeeBreakdown(contracts, price).totalFee;
}
