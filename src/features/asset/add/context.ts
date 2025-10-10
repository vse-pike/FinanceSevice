import { CurrencyCatalog } from '@/shared/currency-catalog.js';
import { AssetType, ValuationMode } from '@prisma/client';
import { ConfirmAction } from './render-configs/keyboard.js';

export type AddAssetModel = {
  name?: string;
  type?: AssetType;
  currency?: string;
  valuationMode?: ValuationMode;
  qty?: number;
  total?: number | null;
  debt?: number | null;
  confirm?: ConfirmAction | null;
};

export interface Services {
  saveAsset(model: Required<AddAssetModel>): Promise<void>;
}

export interface AddAssetCtx {
  model: AddAssetModel;
  services: Services;
  deps: {
    currencies: CurrencyCatalog;
  };
}
