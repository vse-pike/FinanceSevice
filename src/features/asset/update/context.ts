import { Prisma, ValuationMode } from '@prisma/client';
import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { AssetDbModel } from './asset-db.model.js';
import { Message } from 'telegraf/types';

export enum UpdateMenuAction {
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export type Asset = {
  id?: string;
  name?: string;
  valuationMode?: ValuationMode;
  qty?: Prisma.Decimal;
  currency?: string;
  total?: Prisma.Decimal | null;
  debt?: Prisma.Decimal | null;
};

export type UpdateAssetCtx = {
  assets?: AssetDbModel[];
  model?: Asset;
  action?: UpdateMenuAction | null;
};

export interface Services {
  updateAsset(model: Required<Asset>): Promise<void>;
  deleteAsset(assetId: string): Promise<void>;
}

export interface UpdateCommandCtx {
  context: UpdateAssetCtx;
  services: Services;
  deps: {
    currencies: CurrencyCatalog;
  };
  ui?: {
    show?: (text: string) => Promise<Message.TextMessage>;
  };
}
