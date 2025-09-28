import { BusinessException } from '../../shared/business-exception.js';
import { Ctx } from './command.js';

export type TelegramUser = {
  telegramId: bigint;
  username: string;
};

export function extractUser(ctx: Ctx): TelegramUser {
  const tg = ctx.from;

  if (!tg) {
    throw new BusinessException('Не могу определить пользователя');
  }
  const telegramId = BigInt(tg.id);
  const username = tg.username ?? `user_${tg.id}`;

  return {
    telegramId,
    username,
  };
}
