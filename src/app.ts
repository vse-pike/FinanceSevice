import Fastify from 'fastify';
import { buildBot } from '@/infrastructure/bot/telegraf.js';
import { registerHealthRoutes } from '@/features/health/http.js';
import { env } from './shared/env.js';

async function main() {
  const app = Fastify({ logger: true });
  const token = env.BOT_TOKEN;
  const bot = buildBot(token);

  // HTTP: health/ready
  await registerHealthRoutes(app);

  // Стартуем HTTP (для health/ready; вебхука нет)
  const port = Number(process.env.PORT ?? 3000);
  const host = '0.0.0.0';
  await app.listen({ port, host });
  app.log.info({ port }, 'HTTP server started');

  // Телеграм: long-polling
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
