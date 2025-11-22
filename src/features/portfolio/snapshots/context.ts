import { Message } from 'telegraf/types';
import { AssetType, Prisma } from '@prisma/client';

export type SnapPeriod = 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';

export type SnapshotCurrencySlice = {
  endNet: Prisma.Decimal;
  deltaNet: Prisma.Decimal;
  deltaNetPct?: number;
  market: Prisma.Decimal;
  marketPct?: number;
  actions: Prisma.Decimal;
  actionsPct?: number;
};

export type SnapshotItem = {
  name: string;
  currency: string;
  type: AssetType;
  qty: Prisma.Decimal;
  usd: SnapshotCurrencySlice;
};

export type SnapshotTotals = {
  usd: {
    endNet: Prisma.Decimal;
  };
};

export type SnapshotCtxState = {
  userId: string;
  period?: SnapPeriod;

  items?: SnapshotItem[];
  totals?: SnapshotTotals;
  snapshotsCount?: number;
};

export interface SnapshotCommandCtx {
  context: SnapshotCtxState;
  ui?: { show?: (text: string) => Promise<Message.TextMessage> };
}
