import { Telegraf } from 'telegraf';
import { env } from '@/shared/env.js';
// import { logger } from '@/shared/logger.js';
// import { registerUser } from '@/users/commands/register.js';
// import { prisma } from '@/shared/db.js';
// import { addAsset } from '@/assets/commands/add-asset.js';

export function buildBot() {
  const bot = new Telegraf(env.BOT_TOKEN);

  bot.start(async (ctx) => {
    console.log('Привет!');
  });

  // bot.command('add', async (ctx) => {
  //   // Пример: /add BTC 0.5 USD
  //   const parts = ctx.message.text.trim().split(/\s+/);
  //   if (parts.length < 4) return ctx.reply('Используй: /add <SYMBOL> <AMOUNT> <CURRENCY>');
  //   const [, symbol, amountStr, currency] = parts;

  //   // получаем нашего юзера по telegramId
  //   const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id.toString() } });
  //   if (!user) return ctx.reply('Сначала /start');

  //   try {
  //     const res = await addAsset({ userId: user.id, symbol, amount: Number(amountStr), currency });
  //     await ctx.reply(`✅ Добавлен актив ${symbol} (${res.id})`);
  //   } catch (e: any) {
  //     logger.error(e);
  //     await ctx.reply(`❌ ${e.message ?? 'Ошибка'}`);
  //   }
  // });

  return bot;
}
