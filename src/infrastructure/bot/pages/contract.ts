import { InlineKeyboardMarkup } from 'telegraf/types';

export type View = { text: string; keyboard?: InlineKeyboardMarkup };
export type Result = { success: boolean; message?: string };
export type NextPage<T> = { done: true } | { done: false; page: Page<T> };

export interface Page<T> {
  render(ctx: T, error?: string): View;

  handleInput(ctx: T, input: string): Result | Promise<Result>;

  next(ctx?: T): NextPage<T> | Promise<NextPage<T>>;
}
