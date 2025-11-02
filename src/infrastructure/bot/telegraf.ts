import { AppError, BusinessException } from '@/shared/business-exception.js';
import { getErrorMessage } from './error.js';
import { UserStateContainer } from './user-state.js';
import { CommandFactory } from './command/command-factory.js';
import { extractUser } from './command/command-helper.js';
import { FastifyInstance } from 'fastify';
import { Telegraf } from 'telegraf';
import { Ctx } from '@/types/ctx.js';
import { loggers } from '@/logger.js';

const COMMAND_PREFIX = '/';

export function buildBot(token: string, app: FastifyInstance) {
  const bot = new Telegraf(token);
  const states = new UserStateContainer();
  const factory = new CommandFactory();

  bot.use(async (ctx: Ctx, next) => {
    loggers.telegram.info(
      { userId: ctx.from?.id, username: ctx.from?.username },
      `Получено сообщение: ${(ctx.message as any)?.text ?? (ctx.callbackQuery as any)?.data ?? ''}`,
    );
    if (ctx.from) ctx.user = extractUser(ctx);
    ctx.di = app.di.cradle;
    await next();
  });

  bot.on('message', async (ctx, next) => {
    await dispatch(ctx as any);
    return next();
  });

  bot.on('callback_query', async (ctx, next) => {
    await dispatch(ctx as any);
    return next();
  });

  async function dispatch(ctx: Ctx) {
    const tgId = ctx.user.telegramId;
    const msg = 'text' in (ctx.message ?? {}) ? ((ctx.message as any).text ?? '') : '';

    if (msg && msg.startsWith(COMMAND_PREFIX)) {
      states.clear(tgId);

      const cmdId = msg.split(' ')[0];
      const cmd = factory.create(cmdId);

      if (!cmd) {
        throw new BusinessException('Неизвестная команда');
      }

      states.set(tgId, cmd);

      loggers.telegram.info({ userId: ctx.from?.id }, `Вызвана команда: ${cmdId}`);
      await cmd.execute(ctx);

      if (cmd.isFinished) states.clear(tgId);
      return;
    }

    const pending = states.get(tgId);
    if (!pending) return;

    await pending.execute(ctx);

    if (pending.isFinished) states.clear(tgId);
  }

  bot.catch(async (err, ctx) => {
    try {
      if (err instanceof AppError) {
        loggers.telegram.error({ type: err.name }, `Получена ошибка: ${err.message}`);
        await ctx.reply(getErrorMessage(err));
      } else {
        loggers.telegram.error({ err }, 'Необработанная ошибка в Telegraf');
      }
    } catch {
      //ignore
    } finally {
      if (err instanceof BusinessException) states.clear(BigInt(ctx.from!.id));
    }
  });

  return bot;
}
