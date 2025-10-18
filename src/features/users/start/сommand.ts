import { db } from '@/infrastructure/db/db.js';
import { BusinessException } from '../../../shared/business-exception.js';
import { ICommand } from '@/infrastructure/bot/command/command.js';
import { Ctx } from '@/types/ctx.js';

export class StartCommand implements ICommand {
  static name = '/start';
  isFinished = false;

  async execute(ctx: Ctx): Promise<void> {
    try {
      const user = ctx.user;

      await db.user.upsert({
        where: { telegramId: user.telegramId },
        update: { username: user.username },
        create: {
          telegramId: user.telegramId,
          username: user.username,
        },
      });

      ctx.reply('Пользователь зарегистрирован');
    } catch (_) {
      console.log(_);
      throw new BusinessException('Не удалось создать пользователя');
    } finally {
      this.isFinished = true;
    }
  }
}
