import { Command, Ctx } from '@/infrastructure/bot/command.js';
import { db } from '@/infrastructure/db/db.js';
import { BusinessException } from '../../../shared/business-exception.js';
import { TelegramUser } from '@/infrastructure/bot/command-helper.js';

export class StartCommand implements Command {
  static name = '/start';
  isFinished = false;

  async execute(ctx: Ctx): Promise<void> {
    try {
      const user: TelegramUser = ctx.state.user;

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
