import { buildBot } from '@/bot/telegraf.js';
// import { logger } from '@/shared/logger.ts';

async function main() {
  const bot = buildBot();
  await bot.launch();
  // logger.info('🤖 Bot started');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
main().catch((e) => { console.error(e); process.exit(1); });
