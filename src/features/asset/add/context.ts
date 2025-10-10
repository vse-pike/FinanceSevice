import { AssetType, ValuationMode } from '@prisma/client';
import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { Message } from 'telegraf/types';

export enum ConfirmAction {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE',
}

export type AddCommandContext = {
  name?: string;
  type?: AssetType;
  currency?: string;
  valuationMode?: ValuationMode;
  qty?: number | null;
  total?: number | null;
  debt?: number | null;
  confirm?: ConfirmAction;
};

export interface AddAssetServices {
  saveAsset(payload: Required<AddCommandContext>): Promise<void>;
}

export interface AddAssetCtx {
  context: AddCommandContext;
  services: AddAssetServices;
  deps: {
    currencies: CurrencyCatalog;
  };
  ui?: {
    show?: (text: string) => Promise<Message.TextMessage>;
  };
}
