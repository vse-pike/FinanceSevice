import { loggers } from '@/logger.js';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

const prisma = db as any;

prisma.$on('query', (e: any) => {
  loggers.db.info({ query: e.query, duration: e.duration }, 'Запрос в БД выполнен');
});

prisma.$on('error', (e: any) => {
  loggers.db.error({ message: e.message }, 'Ошибка при работе с данными в БД');
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
