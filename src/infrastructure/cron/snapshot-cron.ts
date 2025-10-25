import { FastifyInstance } from 'fastify';
import { buildDailySnapshots } from './build-daily.js';
import fp from 'fastify-plugin';
import cron from 'node-cron';

export default fp(async function snapshotCron(app: FastifyInstance) {
  cron.schedule(
    '0 0 * * *',
    async () => {
      app.log.info('[snapshots] daily job started');
      try {
        await buildDailySnapshots(app);
        app.log.info('[snapshots] daily job done');
      } catch (e) {
        app.log.error({ err: e }, '[snapshots] daily job failed');
      }
    },
    { timezone: 'UTC' },
  );
});
