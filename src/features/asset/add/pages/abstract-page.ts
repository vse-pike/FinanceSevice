import type { NextPage, Page, Result, View } from '@/infrastructure/bot/pages/contract.js';
import { InlineKeyboardMarkup } from 'telegraf/types';

export abstract class FieldPage<T> implements Page<T> {
  constructor(protected readonly field: keyof any) {}

  protected abstract renderContent(ctx: T, error?: string): string;
  protected keyboard?(): InlineKeyboardMarkup | undefined;

  abstract handleInput(ctx: T, input: string): Result | Promise<Result>;
  abstract next(ctx?: T): NextPage<T> | Promise<NextPage<T>>;

  render(ctx: T, error?: string): View {
    return { text: this.renderContent(ctx, error), keyboard: this.keyboard?.() };
  }
}
