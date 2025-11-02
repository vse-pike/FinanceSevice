import Fastify from 'fastify';
import { buildBot } from '@/infrastructure/bot/telegraf.js';
import { env } from './env.js';
import { makeContainer } from './di.js';
import snapshotCron from './infrastructure/cron/snapshot-cron.js';
import { loggers } from './logger.js';

async function main() {
  const app = Fastify();
  const token = env.BOT_TOKEN;

  const di = await makeContainer();
  app.di = di;

  // Регистрируем крон джобу
  app.register(snapshotCron);

  // Стартуем HTTP (для health/ready; вебхука нет)
  const port = Number(process.env.PORT ?? 3000);
  const host = '0.0.0.0';
  await app.listen({ port, host });
  loggers.http.info('HTTP сервер запущен');
  const bot = buildBot(token, app);

  await bot.launch();

  // Graceful shutdown
  process.once('SIGINT', async () => {
    loggers.http.info('HTTP сервер остановлен');
    bot.stop('SIGINT');
    await app.close();
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
