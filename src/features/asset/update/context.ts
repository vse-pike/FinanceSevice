import { Message } from 'telegraf/types';
import { Asset } from '@prisma/client';

export enum UpdateMenuAction {
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export type UpdateAssetCtx = {
  userId: string;
  assets?: Partial<Asset>[];
  model?: Partial<Asset>;
  action?: UpdateMenuAction | null;
};

export interface UpdateCommandCtx {
  context: UpdateAssetCtx;
  ui?: {
    show?: (text: string) => Promise<Message.TextMessage>;
  };
}
