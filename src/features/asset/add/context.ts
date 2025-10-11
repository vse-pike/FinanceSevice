import { AssetType, ValuationMode } from '@prisma/client';
import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { Message } from 'telegraf/types';

export enum ConfirmAction {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE',
}

export type Asset = {
  name?: string;
  type?: AssetType;
  currency?: string;
  valuationMode?: ValuationMode;
  qty?: number | null;
  total?: number | null;
  debt?: number | null;
};
export type AddAssetCtx = {
  model?: Asset;
  confirm?: ConfirmAction;
};

export interface AddAssetServices {
  saveAsset(payload: Required<Asset>): Promise<void>;
}

export interface AddCommandCtx {
  context: AddAssetCtx;
  services: AddAssetServices;
  deps: {
    currencies: CurrencyCatalog;
  };
  ui?: {
    show?: (text: string) => Promise<Message.TextMessage>;
  };
}
