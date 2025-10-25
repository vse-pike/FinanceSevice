import { AssetType, Prisma, ValuationMode } from '@prisma/client';

export type MinimalSnapshot = {
  assetId: string;
  name: string;
  type: AssetType;
  currency: string;
  qty: Prisma.Decimal;
  valuationMode: ValuationMode;
  valuesJson: unknown;
};

export type SnapshotDeltaResult = {
  items: SnapshotItemUSD[];
  totals: { usd: { endNet: Prisma.Decimal } };
};

export type SnapshotItemUSD = {
  assetId: string;
  name: string;
  currency: string;
  type: AssetType;
  qty: Prisma.Decimal;
  valuationMode: ValuationMode;
  usd: {
    startNet: Prisma.Decimal;
    endNet: Prisma.Decimal;
    deltaNet: Prisma.Decimal;
    deltaNetPct?: number;
    market: Prisma.Decimal;
    marketPct?: number;
    actions: Prisma.Decimal;
    actionsPct?: number;
  };
};

export type ValueJson = {
  price?: string;
  gross: string;
  debt: string;
  net: string;
};

export type ValuesJson = {
  // RUB: ValueJson;
  USD: ValueJson;
};
