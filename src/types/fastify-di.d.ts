import { AppContainer } from '@/di.ts';
import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    di: AppContainer;
  }
}
