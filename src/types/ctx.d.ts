import { AppCradle } from '@/di.ts';
import { TelegramUser } from '@/infrastructure/bot/command/command-helper.ts';
import 'telegraf';

declare module 'telegraf' {
  interface Context {
    di: AppCradle;
    user: TelegramUser;
  }
}

export type Ctx = import('telegraf').Context;
