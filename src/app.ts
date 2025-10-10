import Fastify from 'fastify';
import { buildBot } from '@/infrastructure/bot/telegraf.js';
import { env } from './shared/env.js';
import chokidar from 'chokidar';
import { CurrencyCatalog, CurrencyJsonSchema } from './shared/currency-catalog.js';
import { readFile } from 'node:fs/promises';

async function main() {
  const app = Fastify({ logger: true });
  const token = env.BOT_TOKEN;

  // Подгружаем зависимости
  const currencies = await CurrencyCatalog.fromFile('./src/shared/currencies.json');
  app.log.info(`Loaded ${currencies.codes().length} currencies`);

  chokidar.watch('./src/shared/currencies.json').on('change', async () => {
    const raw = await readFile('./src/shared/currencies.json', 'utf-8');
    const parsed = CurrencyJsonSchema.parse(JSON.parse(raw));
    currencies.replace(parsed);
    app.log.info('Currencies reloaded');
  });

  // Стартуем HTTP (для health/ready; вебхука нет)
  const port = Number(process.env.PORT ?? 3000);
  const host = '0.0.0.0';
  await app.listen({ port, host });
  app.log.info({ port }, 'HTTP server started');

  // Телеграм: long-polling
  const bot = buildBot(token, { currencies: currencies });
  await bot.launch();
  app.log.info('Telegram bot launched (long-polling)');

  // Graceful shutdown
  process.once('SIGINT', async () => {
    app.log.info('SIGINT');
    bot.stop('SIGINT');
    await app.close();
  });
  process.once('SIGTERM', async () => {
    app.log.info('SIGTERM');
    bot.stop('SIGTERM');
    await app.close();
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
