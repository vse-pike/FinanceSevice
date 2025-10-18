import { AppCradle } from '@/di.js';
import { Asset } from '@/infrastructure/db/asset-db.service.js';
import { Prisma } from '@prisma/client';
import { Message } from 'telegraf/types';

export type PortfolioCtx = {
  userId: string;
  targetCurrency?: string;
  assets?: Asset[];
  gross?: Prisma.Decimal;
  debt?: Prisma.Decimal;
};

export interface PortfolioCommandCtx {
  context: PortfolioCtx;
  di: AppCradle;
  ui?: { show?: (text: string) => Promise<Message.TextMessage> };
}
