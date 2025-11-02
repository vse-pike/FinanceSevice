import pino from 'pino';

export const baseLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'HH:MM:ss.l' },
  },
});

export const loggers = {
  http: baseLogger.child({ module: 'http' }),
  telegram: baseLogger.child({ module: 'telegram' }),
  cron: baseLogger.child({ module: 'cron' }),
  db: baseLogger.child({ module: 'db' }),
};
