import { FastifyInstance } from 'fastify';
import { buildDailySnapshots } from './build-daily.js';
import fp from 'fastify-plugin';
import cron from 'node-cron';
import { loggers } from '@/logger.js';

export default fp(async function snapshotCron(app: FastifyInstance) {
  cron.schedule(
    '0 0 * * *',
    async () => {
      loggers.cron.info('Джоба снапшотов запущена');
      await buildDailySnapshots(app);
      loggers.cron.info('Джоба снапшотов завершена');
    },
    { timezone: 'UTC' },
  );
});
