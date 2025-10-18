import { Message } from 'telegraf/types';
import { AppCradle } from '@/di.js';
import { Asset } from '@/infrastructure/db/asset-db.service.js';

export enum UpdateMenuAction {
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export type UpdateAssetCtx = {
  userId: string;
  assets?: Asset[];
  model?: Asset;
  action?: UpdateMenuAction | null;
};

export interface UpdateCommandCtx {
  context: UpdateAssetCtx;
  di: AppCradle;
  ui?: {
    show?: (text: string) => Promise<Message.TextMessage>;
  };
}
