import { extractUser } from '@/infrastructure/bot/command-helper.js';
import { BusinessException } from '@/shared/business-exception.js';
import { Telegraf } from 'telegraf';
import { CommandFactory } from './command-factory.js';
import type { Ctx } from './command.js';
import { getErrorMessage } from './error.js';
import { UserStateContainer } from './user-state.js';

const COMMAND_PREFIX = '/';

export function buildBot(token: string) {
  const bot = new Telegraf(token);
  const states = new UserStateContainer();
  const factory = new CommandFactory();

  bot.use(async (ctx: Ctx, next) => {
    if (ctx.from) {
      const user = extractUser(ctx);
      ctx.state.user = user;
    }
    await next();
  });

  bot.on('message', dispatch);
  bot.on('callback_query', (ctx) => dispatch(ctx as any));

  async function dispatch(ctx: Ctx) {
    const tgId = BigInt(ctx.from!.id);
    const msg = 'text' in (ctx.message ?? {}) ? ((ctx.message as any).text ?? '') : '';

    if (msg && msg.startsWith(COMMAND_PREFIX)) {
      states.clear(tgId);

      const cmdId = msg.split(' ')[0];
      const cmd = factory.create(cmdId);

      if (!cmd) {
        throw new BusinessException('Неизвестная команда');
      }

      states.set(tgId, cmd);

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
      await ctx.reply(getErrorMessage(err));
    } catch {
      //ignore
    } finally {
      if (err instanceof BusinessException) states.clear(BigInt(ctx.from!.id));
    }
  });

  return bot;
}
