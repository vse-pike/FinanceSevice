import { BusinessException } from '../../../shared/business-exception.js';
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

export function readText(ctx: Ctx): string | null {
  const msg = ctx.message;
  if (!msg) return null;
  if ('text' in msg && typeof msg.text === 'string') {
    const text = msg.text.trim();
    return text.length > 0 ? text : null;
  }
  return null;
}

export function readCallbackData(ctx: Ctx): string | null {
  const cb = ctx.callbackQuery;
  if (!cb) return null;
  if ('data' in cb && typeof cb.data === 'string') {
    return cb.data.trim();
  }
  return null;
}
