import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));
  app.get('/ready', async () => ({ ok: true }));
}
