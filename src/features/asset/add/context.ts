import { Message } from 'telegraf/types';
import { AppCradle } from '@/di.js';
import { Asset } from '@prisma/client';

export enum ConfirmAction {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE',
}

export type AddAssetCtx = {
  userId: string;
  model?: Asset;
  confirm?: ConfirmAction;
};

export interface AddCommandCtx {
  context: AddAssetCtx;
  di: AppCradle;
  ui?: {
    show?: (text: string) => Promise<Message.TextMessage>;
  };
}
